import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Auto-initialize default users on startup
async function initializeDefaultUsers() {
  try {
    const defaultUsers = [
      {
        email: 'admin@decorizz.com',
        password: 'Admin@123',
        name: 'Admin',
        role: 'admin',
      },
      {
        email: 'user@decorizz.com',
        password: 'User@123',
        name: 'Test User',
        role: 'user',
      },
    ];
    
    console.log('=== Initializing default users ===');
    
    for (const userData of defaultUsers) {
      try {
        // Check if user already exists
        const existingUsers = await kv.getByPrefix('user:');
        const userExists = existingUsers?.some((u: any) => u.email === userData.email);
        
        if (userExists) {
          console.log(`${userData.role} user already exists: ${userData.email}`);
          continue;
        }
        
        console.log(`Creating ${userData.role} user: ${userData.email}`);
        
        // Create user
        const { data, error } = await supabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          user_metadata: { name: userData.name, role: userData.role },
          email_confirm: true,
        });
        
        if (error) {
          console.log(`Error creating ${userData.role}:`, error.message);
          continue;
        }
        
        // Store in KV
        await kv.set(`user:${data.user.id}`, {
          id: data.user.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          createdAt: new Date().toISOString(),
        });
        
        console.log(`✓ ${userData.role} created: ${userData.email} / ${userData.password}`);
      } catch (err) {
        console.log(`Failed to create ${userData.role}:`, err);
      }
    }
    
    console.log('=== Initialization complete ===');
  } catch (error) {
    console.log('Failed to initialize users:', error);
  }
}

// Initialize gallery storage bucket
async function initializeGalleryBucket() {
  try {
    const bucketName = 'make-52d68140-gallery';
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log('Creating gallery bucket...');
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      });
      if (error) {
        console.log('Error creating gallery bucket:', error);
      } else {
        console.log('✓ Gallery bucket created');
      }
    } else {
      console.log('Gallery bucket already exists');
    }
  } catch (error) {
    console.log('Failed to initialize gallery bucket:', error);
  }
}

// Initialize on startup
initializeDefaultUsers();
initializeGalleryBucket();

// Helper function to verify auth
async function verifyAuth(request: Request) {
  const accessToken = request.headers.get('Authorization')?.split(' ')[1];
  if (!accessToken) return null;
  
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user) return null;
  return user;
}

// Initialize default admin (call this endpoint to create default admin)
app.post('/make-server-52d68140/auth/init-admin', async (c) => {
  try {
    const defaultAdminEmail = 'admin@decorizz.com';
    const defaultAdminPassword = 'Admin@123';
    
    // Check if admin already exists
    const existingAdmin = await kv.getByPrefix('user:');
    const adminExists = existingAdmin?.some((u: any) => u.email === defaultAdminEmail);
    
    if (adminExists) {
      return c.json({ message: 'Admin user already exists', email: defaultAdminEmail });
    }
    
    // Create default admin user
    const { data, error } = await supabase.auth.admin.createUser({
      email: defaultAdminEmail,
      password: defaultAdminPassword,
      user_metadata: { name: 'Admin', role: 'admin' },
      email_confirm: true,
    });
    
    if (error) {
      console.log('Init admin error:', error);
      return c.json({ error: error.message }, 400);
    }
    
    // Store in KV
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email: defaultAdminEmail,
      name: 'Admin',
      role: 'admin',
      createdAt: new Date().toISOString(),
    });
    
    return c.json({ 
      success: true, 
      message: 'Default admin created successfully',
      credentials: {
        email: defaultAdminEmail,
        password: defaultAdminPassword
      }
    });
  } catch (error) {
    console.log('Init admin error:', error);
    return c.json({ error: 'Failed to initialize admin' }, 500);
  }
});

// Auth Routes
app.post('/make-server-52d68140/auth/signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role: 'user' },
      email_confirm: true, // Auto-confirm since email server not configured
    });
    
    if (error) {
      console.log('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }
    
    // Store user profile
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email,
      name,
      role: 'user',
      createdAt: new Date().toISOString(),
    });
    
    return c.json({ success: true, user: data.user });
  } catch (error) {
    console.log('Signup error:', error);
    return c.json({ error: 'Signup failed' }, 500);
  }
});

app.post('/make-server-52d68140/auth/admin-signup', async (c) => {
  try {
    const { email, password, name, adminKey } = await c.req.json();
    
    // Simple admin key check (in production, use better validation)
    if (adminKey !== 'ADMIN_SECRET_2024') {
      return c.json({ error: 'Invalid admin key' }, 403);
    }
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role: 'admin' },
      email_confirm: true,
    });
    
    if (error) {
      console.log('Admin signup error:', error);
      return c.json({ error: error.message }, 400);
    }
    
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email,
      name,
      role: 'admin',
      createdAt: new Date().toISOString(),
    });
    
    return c.json({ success: true, user: data.user });
  } catch (error) {
    console.log('Admin signup error:', error);
    return c.json({ error: 'Admin signup failed' }, 500);
  }
});

app.get('/make-server-52d68140/auth/user', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Try to get profile from KV store first
    let profile = await kv.get(`user:${user.id}`);
    
    // If not in KV, create from user metadata
    if (!profile) {
      console.log('Profile not found in KV, creating from user metadata:', user.user_metadata);
      profile = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        role: user.user_metadata?.role || 'user',
        createdAt: new Date().toISOString(),
      };
      
      // Save to KV for next time
      await kv.set(`user:${user.id}`, profile);
    }
    
    return c.json({ user: profile });
  } catch (error) {
    console.log('Get user error:', error);
    return c.json({ error: 'Failed to get user' }, 500);
  }
});

// Products Routes
app.get('/make-server-52d68140/products', async (c) => {
  try {
    const products = await kv.getByPrefix('product:');
    return c.json({ products: products || [] });
  } catch (error) {
    console.log('Get products error:', error);
    return c.json({ error: 'Failed to fetch products' }, 500);
  }
});

app.get('/make-server-52d68140/products/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const product = await kv.get(`product:${id}`);
    
    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }
    
    return c.json({ product });
  } catch (error) {
    console.log('Get product error:', error);
    return c.json({ error: 'Failed to fetch product' }, 500);
  }
});


// Product Image Upload
app.post('/make-server-52d68140/products/upload', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) return c.json({ error: 'No file provided' }, 400);

    const fileExt = file.name.split('.').pop();
    const fileName = `products/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { data, error } = await supabase.storage
      .from('make-52d68140-gallery')
      .upload(fileName, buffer, { contentType: file.type });

    if (error) {
      console.log('Upload error:', error);
      return c.json({ error: 'Upload failed' }, 500);
    }

    const { data: urlData } = supabase.storage
      .from('make-52d68140-gallery')
      .getPublicUrl(fileName);

    return c.json({ success: true, url: urlData.publicUrl });
  } catch (error) {
    console.log('Upload error:', error);
    return c.json({ error: 'Upload failed' }, 500);
  }
});
app.post('/make-server-52d68140/products', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile || userProfile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    const productData = await c.req.json();
    const productId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const product = {
      id: productId,
      ...productData,
      createdAt: new Date().toISOString(),
    };
    
    await kv.set(`product:${productId}`, product);
    
    return c.json({ success: true, product });
  } catch (error) {
    console.log('Create product error:', error);
    return c.json({ error: 'Failed to create product' }, 500);
  }
});

app.put('/make-server-52d68140/products/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile || userProfile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    const id = c.req.param('id');
    const updates = await c.req.json();
    
    const existing = await kv.get(`product:${id}`);
    if (!existing) {
      return c.json({ error: 'Product not found' }, 404);
    }
    
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await kv.set(`product:${id}`, updated);
    
    return c.json({ success: true, product: updated });
  } catch (error) {
    console.log('Update product error:', error);
    return c.json({ error: 'Failed to update product' }, 500);
  }
});

app.delete('/make-server-52d68140/products/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile || userProfile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    const id = c.req.param('id');
    await kv.del(`product:${id}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.log('Delete product error:', error);
    return c.json({ error: 'Failed to delete product' }, 500);
  }
});

// Cart Routes
app.get('/make-server-52d68140/cart', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const cart = await kv.get(`cart:${user.id}`) || { items: [] };
    return c.json({ cart });
  } catch (error) {
    console.log('Get cart error:', error);
    return c.json({ error: 'Failed to fetch cart' }, 500);
  }
});

app.post('/make-server-52d68140/cart', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
  const { productId, quantity, size, color, format, frameColor, price, subsection } = await c.req.json();
    
    const cart = await kv.get(`cart:${user.id}`) || { items: [] };
  const existingIndex = cart.items.findIndex(
    (item: any) => item.productId === productId && item.size === size && item.color === color && item.format === format
  );
    
    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity += quantity;
    } else {
      cart.items.push({ productId, quantity, size, color, format, frameColor, price, subsection });
    }
    
    await kv.set(`cart:${user.id}`, cart);
    
    return c.json({ success: true, cart });
  } catch (error) {
    console.log('Add to cart error:', error);
    return c.json({ error: 'Failed to add to cart' }, 500);
  }
});

app.delete('/make-server-52d68140/cart/:productId', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const productId = c.req.param('productId');
    const cart = await kv.get(`cart:${user.id}`) || { items: [] };
    
    cart.items = cart.items.filter((item: any) => item.productId !== productId);
    
    await kv.set(`cart:${user.id}`, cart);
    
    return c.json({ success: true, cart });
  } catch (error) {
    console.log('Remove from cart error:', error);
    return c.json({ error: 'Failed to remove from cart' }, 500);
  }
});

// Wishlist Routes
app.get('/make-server-52d68140/wishlist', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const wishlist = await kv.get(`wishlist:${user.id}`) || { items: [] };
    return c.json({ wishlist });
  } catch (error) {
    console.log('Get wishlist error:', error);
    return c.json({ error: 'Failed to fetch wishlist' }, 500);
  }
});

app.post('/make-server-52d68140/wishlist', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const { productId } = await c.req.json();
    
    const wishlist = await kv.get(`wishlist:${user.id}`) || { items: [] };
    
    if (!wishlist.items.includes(productId)) {
      wishlist.items.push(productId);
    }
    
    await kv.set(`wishlist:${user.id}`, wishlist);
    
    return c.json({ success: true, wishlist });
  } catch (error) {
    console.log('Add to wishlist error:', error);
    return c.json({ error: 'Failed to add to wishlist' }, 500);
  }
});


// Email notification function
const APP_URL = Deno.env.get('https://photoframe-eight.vercel.app/') ?? 'http://localhost:3001';
async function sendOrderEmail(orderData: any, userEmail: string, userName?: string) {
  try {
    const payStatus = (orderData.paymentStatus || 'pending').toLowerCase();
    const payColor = payStatus === 'completed' ? '#10b981' : payStatus === 'failed' ? '#ef4444' : '#f59e0b';
    const shippingName = orderData.shippingAddress?.fullName || orderData.shippingAddress?.name || userName || 'Customer';

    const emailContent = {
      from: 'Decorizz <info@decorizz.com>',
      to: userEmail,
      reply_to: 'info@decorizz.com',
      subject: `🎉 New Order Received - ${orderData.id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #14b8a6 0%, #0891b2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">🎉 New Order Received!</h1>
          </div>
          
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #1f2937; margin-top: 0;">Order Details</h2>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 10px 0;"><strong>Order ID:</strong> ${orderData.id}</p>
              <p style="margin: 10px 0;"><strong>Customer:</strong> ${shippingName}</p>
              <p style="margin: 10px 0;"><strong>Customer Email:</strong> ${userEmail}</p>
              <p style="margin: 10px 0;"><strong>Total Amount:</strong> &#8377;${(orderData.total ?? 0).toFixed(2)}</p>
              <p style="margin: 10px 0;"><strong>Payment Status:</strong> <span style="color: ${payColor}; text-transform: capitalize;">${payStatus}</span></p>
              <p style="margin: 10px 0;"><strong>Order Date:</strong> ${new Date(orderData.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
            </div>

            <h3 style="color: #1f2937;">Shipping Address</h3>
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 5px 0;"><strong>${shippingName}</strong></p>
              <p style="margin: 5px 0;">${orderData.shippingAddress?.phone || 'N/A'}</p>
              <p style="margin: 5px 0;">${orderData.shippingAddress?.address || 'N/A'}</p>
              <p style="margin: 5px 0;">${orderData.shippingAddress?.city || 'N/A'}, ${orderData.shippingAddress?.state || 'N/A'} - ${orderData.shippingAddress?.zipCode || 'N/A'}</p>
            </div>

            <h3 style="color: #1f2937;">Order Items</h3>
            <div style="background: white; padding: 20px; border-radius: 8px;">
              ${orderData.items?.map((item: any) => `
                <div style="border-bottom: 1px solid #e5e7eb; padding: 15px 0;">
                  <p style="margin: 5px 0;"><strong>${item.name || 'Product'}</strong></p>
                  <p style="margin: 5px 0; color: #6b7280;">Size: ${item.size || 'N/A'} | Color: ${item.color || 'N/A'}</p>
                  <p style="margin: 5px 0;">Quantity: ${item.quantity} &times; &#8377;${item.price} = &#8377;${(item.quantity * item.price).toFixed(2)}</p>
                </div>
              `).join('') || '<p>No items</p>'}
            </div>

            <div style="margin-top: 30px; padding: 20px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
             
            </div>
          </div>

          <div style="background: #1f2937; padding: 20px; text-align: center; color: white;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} Decorizz. All rights reserved.</p>
          </div>
        </div>
      `
    };

    // Log email content
    console.log('📧 Sending email notification to:', emailContent.to);

    // Send email via Resend
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailContent)
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Resend API error:', result);
        return false;
      }

      console.log('✅ Email sent successfully:', result.id);
      return true;
    } catch (emailError) {
      console.error('Failed to send email via Resend:', emailError);
      return false;
    }
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}
// Forgot password email
async function sendResetEmail(toEmail: string, resetToken: string) {
  try {
    const resetLink = `${APP_URL}/reset-password?token=${encodeURIComponent(resetToken)}`;
    const emailContent = {
      from: 'Decorizz <info@decorizz.com>',
      to: toEmail,
      subject: 'Reset your Decorizz password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #14b8a6 0%, #0891b2 100%); padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0;">Password Reset</h1>
          </div>
          <div style="padding: 24px;">
            <p style="color: #1f2937;">We received a request to reset your password.</p>
            <p style="color: #1f2937;">Click the button below to set a new password:</p>
            <p style="text-align: center;">
              <a href="${resetLink}" style="display:inline-block;background:#14b8a6;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:600">Reset Password</a>
            </p>
            <p style="color:#6b7280;">If the button doesn’t work, copy and paste this link into your browser:</p>
            <p style="word-break:break-all;color:#6b7280;">${resetLink}</p>
            <p style="color:#6b7280;">If you didn’t request this, you can safely ignore this email.</p>
          </div>
          <div style="background:#f3f4f6;padding:16px;text-align:center;color:#6b7280;">
            <p style="margin:0">&copy; ${new Date().getFullYear()} Decorizz</p>
          </div>
        </div>
      `
    };
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailContent),
    });
    const result = await response.json();
    if (!response.ok) {
      console.error('Resend reset email error:', result);
      return false;
    }
    console.log('✅ Reset email sent:', result.id);
    return true;
  } catch (e) {
    console.error('Failed to send reset email:', e);
    return false;
  }
}
// Orders Routes
app.post('/make-server-52d68140/orders', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const orderData = await c.req.json();
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const order = {
      id: orderId,
      userId: user.id,
      ...orderData,
      status: orderData.status || 'pending',
      paymentStatus: orderData.paymentStatus || 'pending',
      createdAt: new Date().toISOString(),
    };
    
    await kv.set(`order:${orderId}`, order);
    
    // Clear cart
    await kv.set(`cart:${user.id}`, { items: [] });
    
    // Send notification to user
    await createNotification(
      user.id,
      'order_placed',
      'Order Placed Successfully',
      `Your order ${orderId} has been placed successfully. Total: ₹${orderData.total}`,
      { orderId, total: orderData.total }
    );
    
    // Send notification to all admins
    const allUsers = await kv.getByPrefix('user:');
    const admins = allUsers?.filter((u: any) => u.role === 'admin');
    
    for (const admin of admins || []) {
      await createNotification(
        admin.id,
        'new_order',
        'New Order Received',
        `New order ${orderId} from customer. Total: ₹${orderData.total}`,
        { orderId, userId: user.id, total: orderData.total }
      );
    }

    // Send email notification
    const userProfile = await kv.get(`user:${user.id}`);
    await sendOrderEmail(order, userProfile?.email || 'customer@example.com', userProfile?.name);

    return c.json({ success: true, order });
  } catch (error) {
    console.log('Create order error:', error);
    return c.json({ error: 'Failed to create order' }, 500);
  }
});

app.get('/make-server-52d68140/orders', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const allOrders = await kv.getByPrefix('order:');
    const userProfile = await kv.get(`user:${user.id}`);
    
    let orders;
    if (userProfile?.role === 'admin') {
      orders = allOrders;
    } else {
      orders = allOrders.filter((order: any) => order.userId === user.id);
    }
    
    return c.json({ orders: orders || [] });
  } catch (error) {
    console.log('Get orders error:', error);
    return c.json({ error: 'Failed to fetch orders' }, 500);
  }
});

app.put('/make-server-52d68140/orders/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile || userProfile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    const id = c.req.param('id');
    const updates = await c.req.json();
    
    const existing = await kv.get(`order:${id}`);
    if (!existing) {
      return c.json({ error: 'Order not found' }, 404);
    }
    
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await kv.set(`order:${id}`, updated);
    
    // Send notification to customer if status changed
    if (updates.status && updates.status !== existing.status) {
      const statusMessages: any = {
        'confirmed': 'Your order has been confirmed and is being prepared.',
        'processing': 'Your order is being processed.',
        'shipped': 'Your order has been shipped and is on its way!',
        'delivered': 'Your order has been delivered. Thank you for shopping with us!',
        'cancelled': 'Your order has been cancelled.',
      };
      
      if (statusMessages[updates.status]) {
        await createNotification(
          existing.userId,
          'order_status',
          `Order ${updates.status.charAt(0).toUpperCase() + updates.status.slice(1)}`,
          `${statusMessages[updates.status]} Order ID: ${id}`,
          { orderId: id, status: updates.status }
        );
      }
    }
    
    return c.json({ success: true, order: updated });
  } catch (error) {
    console.log('Update order error:', error);
    return c.json({ error: 'Failed to update order' }, 500);
  }
});

// Testimonials Routes
app.get('/make-server-52d68140/testimonials', async (c) => {
  try {
    const testimonials = await kv.getByPrefix('testimonial:');
    return c.json({ testimonials: testimonials || [] });
  } catch (error) {
    console.log('Get testimonials error:', error);
    return c.json({ error: 'Failed to fetch testimonials' }, 500);
  }
});

app.post('/make-server-52d68140/testimonials', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile || userProfile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    const testimonialData = await c.req.json();
    const testimonialId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const testimonial = {
      id: testimonialId,
      ...testimonialData,
      createdAt: new Date().toISOString(),
    };
    
    await kv.set(`testimonial:${testimonialId}`, testimonial);
    
    return c.json({ success: true, testimonial });
  } catch (error) {
    console.log('Create testimonial error:', error);
    return c.json({ error: 'Failed to create testimonial' }, 500);
  }
});

app.put('/make-server-52d68140/testimonials/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile || userProfile.role !== 'admin') return c.json({ error: 'Admin access required' }, 403);
    const id = c.req.param('id');
    const existing = await kv.get(`testimonial:${id}`);
    if (!existing) return c.json({ error: 'Testimonial not found' }, 404);
    const updates = await c.req.json();
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await kv.set(`testimonial:${id}`, updated);
    return c.json({ success: true, testimonial: updated });
  } catch (error) {
    console.log('Update testimonial error:', error);
    return c.json({ error: 'Failed to update testimonial' }, 500);
  }
});

app.delete('/make-server-52d68140/testimonials/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile || userProfile.role !== 'admin') return c.json({ error: 'Admin access required' }, 403);
    const id = c.req.param('id');
    const existing = await kv.get(`testimonial:${id}`);
    if (!existing) return c.json({ error: 'Testimonial not found' }, 404);
    await kv.del(`testimonial:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.log('Delete testimonial error:', error);
    return c.json({ error: 'Failed to delete testimonial' }, 500);
  }
});

// Upload testimonial profile image to storage
app.post('/make-server-52d68140/testimonials/profile/upload', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile || userProfile.role !== 'admin') return c.json({ error: 'Admin access required' }, 403);

    const body = await c.req.json();
    const { image, fileName, mimeType } = body || {};
    if (!image || !fileName) return c.json({ error: 'Image and fileName are required' }, 400);

    const parsedMime = mimeType || image.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';
    const base64 = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const filePath = `profiles/${Date.now()}-${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from('make-52d68140-gallery')
      .upload(filePath, buffer, { contentType: parsedMime, upsert: false });
    if (uploadError) return c.json({ error: uploadError.message || 'Upload failed' }, 400);
    const { data: urlData } = supabase.storage.from('make-52d68140-gallery').getPublicUrl(filePath);
    return c.json({ success: true, url: urlData.publicUrl, filePath });
  } catch (e) {
    console.log('Testimonial profile upload error:', e);
    return c.json({ error: 'Upload failed' }, 500);
  }
});

// Gallery Routes
app.get('/make-server-52d68140/gallery', async (c) => {
  try {
    const galleryItems = await kv.getByPrefix('gallery:');
    
    // Images are now stored on Cloudinary, so just return them directly
    return c.json({ galleryItems: galleryItems || [] });
  } catch (error) {
    console.log('Get gallery error:', error);
    return c.json({ error: 'Failed to fetch gallery' }, 500);
  }
});

app.post('/make-server-52d68140/gallery', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile || userProfile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    const body = await c.req.json();
    const { title, description, category, year, imageUrl, publicId } = body;
    
    if (!title || !category || !year || !imageUrl) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    const galleryId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const galleryItem = {
      id: galleryId,
      title,
      description: description || '',
      category,
      year: parseInt(year),
      image: imageUrl,
      publicId: publicId || '',
      createdAt: new Date().toISOString(),
    };
    
    await kv.set(`gallery:${galleryId}`, galleryItem);
    
    return c.json({ success: true, galleryItem });
  } catch (error) {
    console.log('Create gallery item error:', error);
    return c.json({ error: 'Failed to create gallery item' }, 500);
  }
});



app.delete('/make-server-52d68140/gallery/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile || userProfile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    const id = c.req.param('id');
    const galleryItem = await kv.get(`gallery:${id}`);
    
    if (!galleryItem) {
      return c.json({ error: 'Gallery item not found' }, 404);
    }
    
    // Optionally delete from Cloudinary (if publicId is stored)
    // This is optional since Cloudinary has its own management interface
    
    // Delete from KV
    await kv.del(`gallery:${id}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.log('Delete gallery error:', error);
    return c.json({ error: 'Failed to delete photo' }, 500);
  }
});

// Stats Route for Admin
app.get('/make-server-52d68140/stats', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile || userProfile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    const orders = await kv.getByPrefix('order:');
    const products = await kv.getByPrefix('product:');
    const users = await kv.getByPrefix('user:');
    
    const totalRevenue = orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0);
    const pendingOrders = orders.filter((order: any) => order.status === 'pending').length;
    
    return c.json({
      totalOrders: orders.length,
      totalRevenue,
      totalUsers: users.length,
      totalProducts: products.length,
      pendingDeliveries: pendingOrders,
    });
  } catch (error) {
    console.log('Get stats error:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

// Users list (admin-only)
app.get('/make-server-52d68140/users', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile || userProfile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const users = await kv.getByPrefix('user:');
    return c.json({ users });
  } catch (error) {
    console.log('Get users error:', error);
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

// Password Reset Routes
app.post('/make-server-52d68140/auth/forgot-password', async (c) => {
  try {
    const { email } = await c.req.json();
    
    // Check if user exists
    const users = await kv.getByPrefix('user:');
    const user = users?.find((u: any) => u.email === email);
    
    if (!user) {
      // Return success anyway to prevent email enumeration
      return c.json({ success: true, message: 'If the email exists, a reset link has been sent' });
    }
    
    // Generate reset token
    const resetToken = crypto.randomUUID();
    const resetExpiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour
    
    // Store reset token
    await kv.set(`reset:${resetToken}`, {
      userId: user.id,
      email: user.email,
      expiry: resetExpiry,
      used: false,
    });
    
    // Also store by email for lookup
    await kv.set(`reset-email:${email}`, resetToken);
    
    console.log(`Password reset requested for ${email}. Token: ${resetToken}`);
    await sendResetEmail(email, resetToken);
    
    return c.json({ 
      success: true,
      message: 'If the email exists, a reset link has been sent',
      resetToken,
    });
  } catch (error) {
    console.log('Forgot password error:', error);
    return c.json({ error: 'Failed to process password reset request' }, 500);
  }
});

app.post('/make-server-52d68140/auth/verify-reset-token', async (c) => {
  try {
    const { token } = await c.req.json();
    
    const resetData = await kv.get(`reset:${token}`);
    
    if (!resetData) {
      return c.json({ error: 'Invalid or expired reset token' }, 400);
    }
    
    if (resetData.used) {
      return c.json({ error: 'Reset token has already been used' }, 400);
    }
    
    if (new Date(resetData.expiry) < new Date()) {
      return c.json({ error: 'Reset token has expired' }, 400);
    }
    
    return c.json({ success: true, email: resetData.email });
  } catch (error) {
    console.log('Verify reset token error:', error);
    return c.json({ error: 'Failed to verify reset token' }, 500);
  }
});

app.post('/make-server-52d68140/auth/reset-password', async (c) => {
  try {
    const { token, newPassword } = await c.req.json();
    
    const resetData = await kv.get(`reset:${token}`);
    
    if (!resetData || resetData.used) {
      return c.json({ error: 'Invalid or expired reset token' }, 400);
    }
    
    if (new Date(resetData.expiry) < new Date()) {
      return c.json({ error: 'Reset token has expired' }, 400);
    }
    
    // Update password in Supabase
    const { error } = await supabase.auth.admin.updateUserById(
      resetData.userId,
      { password: newPassword }
    );
    
    if (error) {
      console.log('Password update error:', error);
      return c.json({ error: 'Failed to update password' }, 400);
    }
    
    // Mark token as used
    await kv.set(`reset:${token}`, { ...resetData, used: true });
    
    // Clean up email reference
    await kv.del(`reset-email:${resetData.email}`);
    
    console.log(`Password reset successful for ${resetData.email}`);
    
    return c.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    console.log('Reset password error:', error);
    return c.json({ error: 'Failed to reset password' }, 500);
  }
});

// Notification Routes
app.get('/make-server-52d68140/notifications', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const userProfile = await kv.get(`user:${user.id}`);
    const notifications = await kv.getByPrefix(`notification:${user.id}:`);
    
    // Sort by timestamp descending
    const sorted = (notifications || []).sort((a: any, b: any) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    return c.json({ notifications: sorted });
  } catch (error) {
    console.log('Get notifications error:', error);
    return c.json({ error: 'Failed to fetch notifications' }, 500);
  }
});

app.post('/make-server-52d68140/notifications/:id/read', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const id = c.req.param('id');
    const notification = await kv.get(`notification:${user.id}:${id}`);
    
    if (!notification) {
      return c.json({ error: 'Notification not found' }, 404);
    }
    
    await kv.set(`notification:${user.id}:${id}`, { ...notification, read: true });
    
    return c.json({ success: true });
  } catch (error) {
    console.log('Mark notification read error:', error);
    return c.json({ error: 'Failed to mark notification as read' }, 500);
  }
});

app.delete('/make-server-52d68140/notifications/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const id = c.req.param('id');
    await kv.del(`notification:${user.id}:${id}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.log('Delete notification error:', error);
    return c.json({ error: 'Failed to delete notification' }, 500);
  }
});

// Helper function to create notification
async function createNotification(userId: string, type: string, title: string, message: string, data?: any) {
  const notificationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  await kv.set(`notification:${userId}:${notificationId}`, {
    id: notificationId,
    userId,
    type,
    title,
    message,
    data,
    read: false,
    timestamp: new Date().toISOString(),
  });
  
  console.log(`Notification created for user ${userId}: ${title}`);
}



// Gallery Upload Directly to Supabase Storage (FIXED)
app.post("/make-server-52d68140/gallery/upload", async (c) => {
  try {
    // AUTH CHECK
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile || userProfile.role !== "admin") {
      return c.json({ error: "Admin access required" }, 403);
    }

    // IMPORTANT FIX → read raw text instead of JSON
    const raw = await c.req.text();

    let body;
    try {
      body = JSON.parse(raw);
    } catch (err) {
      console.log("JSON parse error", err);
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    const { image, fileName, title, description, category, year, mimeType, productId } = body;

    if (!image || !fileName)
      return c.json({ error: "Image and fileName are required" }, 400);

    // Determine content type: prefer explicit mimeType, otherwise parse from data URL
    const parsedMime =
      mimeType || image.match(/^data:(image\/\w+);base64,/)?.[1] || "image/jpeg";

    // CLEAN BASE64
    const base64 = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

    // FILE PATH
    const filePath = `gallery/${Date.now()}-${fileName}`;

    // UPLOAD TO SUPABASE STORAGE
    const { error: uploadError } = await supabase.storage
      .from("make-52d68140-gallery")
      .upload(filePath, buffer, {
        contentType: parsedMime,
        upsert: false,
      });

    if (uploadError) {
      console.log("Upload error", uploadError);
      return c.json({ error: uploadError.message || "Upload failed" }, 400);
    }

    // PUBLIC URL
    const { data: urlData } = supabase.storage
      .from("make-52d68140-gallery")
      .getPublicUrl(filePath);

    // SAVE IN KV
    const galleryId = `${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const galleryItem = {
      id: galleryId,
      title,
      description: description || "",
      category,
      year,
      image: urlData.publicUrl,
      filePath,
      productId: productId || null,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`gallery:${galleryId}`, galleryItem);

    return c.json({ success: true, galleryItem });
  } catch (e) {
    console.log("Storage upload error:", e);
    return c.json({ error: "Upload failed" }, 500);
  }
});

// Update gallery item (metadata and optional image replace)
app.put('/make-server-52d68140/gallery/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const profile = await kv.get(`user:${user.id}`);
    if (!profile || profile.role !== 'admin') return c.json({ error: 'Admin access required' }, 403);

    const id = c.req.param('id');
    const existing = await kv.get(`gallery:${id}`);
    if (!existing) return c.json({ error: 'Gallery item not found' }, 404);

    const raw = await c.req.text();
    let body: any = {};
    try { body = JSON.parse(raw || '{}'); } catch { return c.json({ error: 'Invalid JSON body' }, 400); }

    const { title, description, category, year, productId, image, fileName, mimeType } = body || {};
    let updatedImage = existing.image;
    let updatedFilePath = existing.filePath;

    if (image && fileName) {
      const parsedMime = mimeType || image.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';
      const base64 = image.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const newPath = `gallery/${Date.now()}-${fileName}`;
      const { error: upErr } = await supabase.storage.from('make-52d68140-gallery').upload(newPath, buffer, { contentType: parsedMime, upsert: false });
      if (upErr) return c.json({ error: upErr.message || 'Upload failed' }, 400);
      const { data: urlData } = supabase.storage.from('make-52d68140-gallery').getPublicUrl(newPath);
      updatedImage = urlData.publicUrl;
      // remove old file if present
      if (existing.filePath) {
        await supabase.storage.from('make-52d68140-gallery').remove([existing.filePath]);
      }
      updatedFilePath = newPath;
    }

    const updated = {
      ...existing,
      title: title ?? existing.title,
      description: (description ?? existing.description) || '',
      category: category ?? existing.category,
      year: year ?? existing.year,
      productId: (productId ?? existing.productId) || null,
      image: updatedImage,
      filePath: updatedFilePath,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`gallery:${id}`, updated);
    return c.json({ success: true, galleryItem: updated });
  } catch (e) {
    console.log('Gallery update error', e);
    return c.json({ error: 'Failed to update gallery item' }, 500);
  }
});

// Upload video via service role (base64) to storage
app.post('/make-server-52d68140/videos/upload', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const profile = await kv.get(`user:${user.id}`);
    if (!profile || profile.role !== 'admin') return c.json({ error: 'Admin access required' }, 403);

    const body = await c.req.json();
    const base64 = String(body?.video || '');
    const fileName = String(body?.fileName || 'video.mp4');
    const mimeType = String(body?.mimeType || 'video/mp4');
    if (!base64) return c.json({ error: 'video required' }, 400);

    // simple size guard (~ bytes from base64 length)
    const approxBytes = Math.floor((base64.length * 3) / 4);
    if (approxBytes > 10 * 1024 * 1024) return c.json({ error: 'Video exceeds 10MB' }, 413);

    const dataPart = base64.replace(/^data:.*?;base64,/, '');
    const buffer = Uint8Array.from(atob(dataPart), (c) => c.charCodeAt(0));
    const path = `videos/${Date.now()}-${fileName}`;
    const { error: vErr } = await supabase.storage.from('make-52d68140-gallery').upload(path, buffer, { contentType: mimeType, upsert: false });
    if (vErr) return c.json({ error: vErr.message || 'Upload failed' }, 400);
    const { data } = supabase.storage.from('make-52d68140-gallery').getPublicUrl(path);
    return c.json({ success: true, url: data.publicUrl, path });
  } catch (e) {
    console.log('Video upload error', e);
    return c.json({ error: 'Upload failed' }, 500);
  }
});
// =============================
// Instagram feed (admin-managed)
// =============================
function normalizeInstagramEmbed(url: string): string {
  try {
    const u = new URL(url);
    // Handle post types: /p/{id}/, /reel/{id}/, /tv/{id}/
    const parts = u.pathname.split('/').filter(Boolean);
    const type = parts[0];
    const id = parts[1];
    if (!id) return url;
    return `https://www.instagram.com/${type}/${id}/embed`;
  } catch {
    return url;
  }
}

app.get('/make-server-52d68140/instagram', async (c) => {
  try {
    const list = await (kv as any).getKeysByPrefix('instagram:');
    const items = (list || []).map((p: any) => p.value).filter(Boolean);
    return c.json({ items });
  } catch (e) {
    return c.json({ items: [], error: 'Failed' }, 500);
  }
});

app.post('/make-server-52d68140/instagram', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const profile = await kv.get(`user:${user.id}`);
    if (!profile || profile.role !== 'admin') return c.json({ error: 'Admin access required' }, 403);
    const body = await c.req.json();
    const rawUrl = String(body?.url || '');
    if (!rawUrl) return c.json({ error: 'url required' }, 400);
    const embedUrl = normalizeInstagramEmbed(rawUrl);
    const id = Date.now().toString();
    const item = { id, url: rawUrl, embedUrl, createdAt: new Date().toISOString() };
    await kv.set(`instagram:${id}`, item);
    return c.json({ success: true, item });
  } catch (e) {
    return c.json({ error: 'Failed to add' }, 500);
  }
});

app.delete('/make-server-52d68140/instagram/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const profile = await kv.get(`user:${user.id}`);
    if (!profile || profile.role !== 'admin') return c.json({ error: 'Admin access required' }, 403);
    const id = c.req.param('id');
    await kv.del(`instagram:${id}`);
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: 'Failed to delete' }, 500);
  }
});
app.delete('/make-server-52d68140/gallery/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile || userProfile.role !== "admin")
      return c.json({ error: "Admin access required" }, 403);

    const id = c.req.param("id");
    const item = await kv.get(`gallery:${id}`);

    if (!item) return c.json({ error: "Gallery item not found" }, 404);

    await supabase.storage
      .from("make-52d68140-gallery")
      .remove([item.filePath]);

    await kv.del(`gallery:${id}`);

    return c.json({ success: true });
  } catch (error) {
    console.log("Gallery delete error:", error);
    return c.json({ error: "Failed to delete" }, 500);
  }
});

// Contact Messages Routes
app.post('/make-server-52d68140/contact-messages', async (c) => {
  try {
    const body = await c.req.json();
    const { name, email, phone, subject, message } = body || {};

    if (!name || !email || !message) {
      return c.json({ error: 'Name, email and message are required' }, 400);
    }

    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const record = {
      id,
      name,
      email,
      phone: phone || '',
      subject: subject || '',
      message,
      createdAt: new Date().toISOString(),
      status: 'new',
    };

    await kv.set(`contact:${id}`, record);

    // Notify admins
    const allUsers = await kv.getByPrefix('user:');
    const admins = allUsers?.filter((u: any) => u.role === 'admin');
    for (const admin of admins || []) {
      await createNotification(
        admin.id,
        'contact_message',
        'New Contact Message',
        `${name} sent a new message${subject ? `: ${subject}` : ''}.`,
        { contactId: id, name, email }
      );
    }

    return c.json({ success: true, contact: record });
  } catch (error) {
    console.log('Create contact message error:', error);
    return c.json({ error: 'Failed to submit message' }, 500);
  }
});

app.get('/make-server-52d68140/contact-messages', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const profile = await kv.get(`user:${user.id}`);
    if (!profile || profile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const messages = await kv.getByPrefix('contact:');
    const sorted = (messages || []).sort((a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return c.json({ contacts: sorted });
  } catch (error) {
    console.log('Get contact messages error:', error);
    return c.json({ error: 'Failed to fetch contact messages' }, 500);
  }
});

app.put('/make-server-52d68140/contact-messages/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const profile = await kv.get(`user:${user.id}`);
    if (!profile || profile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const id = c.req.param('id');
    const existing = await kv.get(`contact:${id}`);
    if (!existing) return c.json({ error: 'Contact message not found' }, 404);

    const updates = await c.req.json();
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await kv.set(`contact:${id}`, updated);

    return c.json({ success: true, contact: updated });
  } catch (error) {
    console.log('Update contact message error:', error);
    return c.json({ error: 'Failed to update contact message' }, 500);
  }
});

app.delete('/make-server-52d68140/contact-messages/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const profile = await kv.get(`user:${user.id}`);
    if (!profile || profile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const id = c.req.param('id');
    const existing = await kv.get(`contact:${id}`);
    if (!existing) return c.json({ error: 'Contact message not found' }, 404);

    await kv.del(`contact:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.log('Delete contact message error:', error);
    return c.json({ error: 'Failed to delete contact message' }, 500);
  }
});

// FAQs: Public GET, Admin CRUD
app.get('/make-server-52d68140/faqs', async (c) => {
  try {
    const items = await kv.getByPrefix('faq:');
    const sorted = (items || []).sort((a: any, b: any) => {
      const ao = a.order ?? 0;
      const bo = b.order ?? 0;
      if (ao !== bo) return ao - bo;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    return c.json({ faqs: sorted });
  } catch (e) {
    console.log('FAQs fetch error', e);
    return c.json({ error: 'Failed to load FAQs' }, 500);
  }
});

app.post('/make-server-52d68140/faqs', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const profile = await kv.get(`user:${user.id}`);
    if (!profile || profile.role !== 'admin') return c.json({ error: 'Admin access required' }, 403);
    const body = await c.req.json();
    const { question, answer, order } = body || {};
    if (!question || !answer) return c.json({ error: 'Question and answer required' }, 400);
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const faq = { id, question, answer, order: Number(order) || 0, createdAt: new Date().toISOString() };
    await kv.set(`faq:${id}`, faq);
    return c.json({ success: true, faq });
  } catch (e) {
    console.log('FAQ create error', e);
    return c.json({ error: 'Failed to create FAQ' }, 500);
  }
});

app.put('/make-server-52d68140/faqs/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const profile = await kv.get(`user:${user.id}`);
    if (!profile || profile.role !== 'admin') return c.json({ error: 'Admin access required' }, 403);
    const id = c.req.param('id');
    const existing = await kv.get(`faq:${id}`);
    if (!existing) return c.json({ error: 'FAQ not found' }, 404);
    const updates = await c.req.json();
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString(), order: Number(updates.order ?? existing.order) };
    await kv.set(`faq:${id}`, updated);
    return c.json({ success: true, faq: updated });
  } catch (e) {
    console.log('FAQ update error', e);
    return c.json({ error: 'Failed to update FAQ' }, 500);
  }
});

app.delete('/make-server-52d68140/faqs/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const profile = await kv.get(`user:${user.id}`);
    if (!profile || profile.role !== 'admin') return c.json({ error: 'Admin access required' }, 403);
    const id = c.req.param('id');
    const existing = await kv.get(`faq:${id}`);
    if (!existing) return c.json({ error: 'FAQ not found' }, 404);
    await kv.del(`faq:${id}`);
    return c.json({ success: true });
  } catch (e) {
    console.log('FAQ delete error', e);
    return c.json({ error: 'Failed to delete FAQ' }, 500);
  }
});

// Videos: Public GET, Admin CRUD
function normalizeVideoUrl(url: string): string {
  try {
    if (!url) return url;
    const u = String(url);
    if (/youtube\.com|youtu\.be/.test(u)) {
      return u.includes('watch?v=') ? u.replace('watch?v=', 'embed/') : u;
    }
    if (/drive\.google\.com/.test(u)) {
      const fileMatch = u.match(/\/file\/d\/([^/]+)/);
      const idParam = u.match(/[?&]id=([^&]+)/);
      const id = (fileMatch && fileMatch[1]) || (idParam && idParam[1]);
      return id ? `https://drive.google.com/file/d/${id}/preview` : u;
    }
    return u;
  } catch {
    return url;
  }
}

function getDriveThumbnail(url: string): string | null {
  try {
    const u = String(url);
    if (!/drive\.google\.com/.test(u)) return null;
    const fileMatch = u.match(/\/file\/d\/([^/]+)/);
    const idParam = u.match(/[?&]id=([^&]+)/);
    const id = (fileMatch && fileMatch[1]) || (idParam && idParam[1]);
    return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w640` : null;
  } catch {
    return null;
  }
}
app.get('/make-server-52d68140/videos', async (c) => {
  try {
    const items = await kv.getByPrefix('video:');
    const sorted = (items || []).sort((a: any, b: any) => {
      const ao = a.order ?? 0;
      const bo = b.order ?? 0;
      if (ao !== bo) return ao - bo;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    return c.json({ videos: sorted });
  } catch (e) {
    console.log('Videos fetch error', e);
    return c.json({ error: 'Failed to load videos' }, 500);
  }
});

app.post('/make-server-52d68140/videos', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const profile = await kv.get(`user:${user.id}`);
    if (!profile || profile.role !== 'admin') return c.json({ error: 'Admin access required' }, 403);
    const body = await c.req.json();
    const { title, url, caption, thumbnail, tags, order, productId } = body || {};
    if (!title || !url) return c.json({ error: 'Title and url required' }, 400);
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const video = {
      id,
      title,
      url: normalizeVideoUrl(url),
      caption: caption || '',
      thumbnail: thumbnail || getDriveThumbnail(url) || '',
      tags: Array.isArray(tags) ? tags : [],
      order: Number(order) || 0,
      productId: productId || null,
      createdAt: new Date().toISOString(),
    };
    await kv.set(`video:${id}`, video);
    return c.json({ success: true, video });
  } catch (e) {
    console.log('Video create error', e);
    return c.json({ error: 'Failed to create video' }, 500);
  }
});

app.put('/make-server-52d68140/videos/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const profile = await kv.get(`user:${user.id}`);
    if (!profile || profile.role !== 'admin') return c.json({ error: 'Admin access required' }, 403);
    const id = c.req.param('id');
    const existing = await kv.get(`video:${id}`);
    if (!existing) return c.json({ error: 'Video not found' }, 404);
    const updates = await c.req.json();
    const merged = { ...updates };
    if (merged.url) merged.url = normalizeVideoUrl(merged.url);
    if (!merged.thumbnail && merged.url) {
      const autoThumb = getDriveThumbnail(merged.url);
      if (autoThumb) merged.thumbnail = autoThumb;
    }
    const updated = { ...existing, ...merged, updatedAt: new Date().toISOString(), order: Number(merged.order ?? existing.order) };
    await kv.set(`video:${id}`, updated);
    return c.json({ success: true, video: updated });
  } catch (e) {
    console.log('Video update error', e);
    return c.json({ error: 'Failed to update video' }, 500);
  }
});

app.post('/make-server-52d68140/videos/:id/like', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const id = c.req.param('id');
    const key = `video-like:${id}:${user.id}`;
    const exists = await kv.get(key);
    if (exists) {
      await kv.del(key);
    } else {
      await kv.set(key, { id, userId: user.id, createdAt: new Date().toISOString() });
    }
    const likes = await kv.getByPrefix(`video-like:${id}:`);
    return c.json({ success: true, liked: !exists, count: (likes || []).length });
  } catch (e) {
    console.log('Video like error', e);
    return c.json({ error: 'Failed to like video' }, 500);
  }
});

app.get('/make-server-52d68140/videos/:id/likes', async (c) => {
  try {
    const id = c.req.param('id');
    const likes = await kv.getByPrefix(`video-like:${id}:`);
    return c.json({ count: (likes || []).length });
  } catch (e) {
    return c.json({ count: 0 });
  }
});

app.get('/make-server-52d68140/videos/:id/comments', async (c) => {
  try {
    const id = c.req.param('id');
    const list = await kv.getByPrefix(`video-comment:${id}:`);
    const sorted = (list || []).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return c.json({ comments: sorted });
  } catch (e) {
    return c.json({ comments: [] });
  }
});

app.post('/make-server-52d68140/videos/:id/comments', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const id = c.req.param('id');
    const body = await c.req.json();
    const text = String(body?.text || '').trim();
    if (!text) return c.json({ error: 'Comment text required' }, 400);
    const commentId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const profile = await kv.get(`user:${user.id}`);
    const comment = { id: commentId, videoId: id, userId: user.id, userName: profile?.name || 'User', text, createdAt: new Date().toISOString() };
    await kv.set(`video-comment:${id}:${commentId}`, comment);
    return c.json({ success: true, comment });
  } catch (e) {
    console.log('Video comment error', e);
    return c.json({ error: 'Failed to add comment' }, 500);
  }
});

app.delete('/make-server-52d68140/videos/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const profile = await kv.get(`user:${user.id}`);
    if (!profile || profile.role !== 'admin') return c.json({ error: 'Admin access required' }, 403);
    const id = c.req.param('id');
    const existing = await kv.get(`video:${id}`);
    if (!existing) return c.json({ error: 'Video not found' }, 404);
    await kv.del(`video:${id}`);
    return c.json({ success: true });
  } catch (e) {
    console.log('Video delete error', e);
    return c.json({ error: 'Failed to delete video' }, 500);
  }
});

// Upload video thumbnail to storage
app.post('/make-server-52d68140/videos/thumbnail/upload', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const profile = await kv.get(`user:${user.id}`);
    if (!profile || profile.role !== 'admin') return c.json({ error: 'Admin access required' }, 403);
    const body = await c.req.json();
    const { image, fileName, mimeType } = body || {};
    if (!image || !fileName) return c.json({ error: 'Image and fileName required' }, 400);
    const parsedMime = mimeType || image.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';
    const base64 = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
    const MAX_THUMB_SIZE = 2 * 1024 * 1024; // 2 MB
    if (buffer.byteLength > MAX_THUMB_SIZE) {
      return c.json({ error: 'Thumbnail too large. Max size is 2MB.' }, 413);
    }
    const filePath = `videos/${Date.now()}-${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from('make-52d68140-gallery')
      .upload(filePath, buffer, { contentType: parsedMime, upsert: false });
    if (uploadError) return c.json({ error: uploadError.message || 'Upload failed' }, 400);
    const { data } = supabase.storage.from('make-52d68140-gallery').getPublicUrl(filePath);
    return c.json({ success: true, url: data.publicUrl, filePath });
  } catch (e) {
    console.log('Video thumbnail upload error:', e);
    return c.json({ error: 'Upload failed' }, 500);
  }
});

app.post('/make-server-52d68140/videos/upload', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const profile = await kv.get(`user:${user.id}`);
    if (!profile || profile.role !== 'admin') return c.json({ error: 'Admin access required' }, 403);
    const body = await c.req.json();
    const { video, fileName, mimeType } = body || {};
    if (!video || !fileName) return c.json({ error: 'Video and fileName required' }, 400);
    const parsedMime = mimeType || video.match(/^data:(video\/[\-\w]+);base64,/)?.[1] || 'video/mp4';
    const base64 = video.replace(/^data:video\/[\-\w]+;base64,/, '');
    const buffer = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
    const MAX_VIDEO_SIZE = 10 * 1024 * 1024; // 10 MB
    if (buffer.byteLength > MAX_VIDEO_SIZE) {
      return c.json({ error: 'Video too large. Max size is 10MB.' }, 413);
    }
    const filePath = `videos/${Date.now()}-${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from('make-52d68140-gallery')
      .upload(filePath, buffer, { contentType: parsedMime, upsert: false });
    if (uploadError) return c.json({ error: uploadError.message || 'Upload failed' }, 400);
    const { data } = supabase.storage.from('make-52d68140-gallery').getPublicUrl(filePath);
    return c.json({ success: true, url: data.publicUrl, filePath });
  } catch (e) {
    console.log('Video upload error:', e);
    return c.json({ error: 'Upload failed' }, 500);
  }
});
Deno.serve(app.fetch);// Add these routes before Deno.serve(app.fetch); in index.tsx

// Payment Routes
app.get('/make-server-52d68140/payments', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile || userProfile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const payments = await kv.getByPrefix('payment:');
    return c.json({ payments: payments || [] });
  } catch (error) {
    console.log('Get payments error:', error);
    return c.json({ error: 'Failed to fetch payments' }, 500);
  }
});

app.post('/make-server-52d68140/payments', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const paymentData = await c.req.json();
    const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  const payment = {
    id: paymentId,
    userId: user.id,
    orderId: paymentData.orderId,
    amount: paymentData.amount,
    paymentMethod: paymentData.paymentMethod || 'razorpay',
    paymentId: paymentData.paymentId || '',
    paymentSignature: paymentData.paymentSignature || '',
    status: paymentData.status || 'pending',
    createdAt: new Date().toISOString(),
  };

    await kv.set(`payment:${paymentId}`, payment);

  if (paymentData.orderId) {
    const order = await kv.get(`order:${paymentData.orderId}`);
    if (order) {
      order.paymentStatus = payment.status;
      order.paymentId = paymentId;
      await kv.set(`order:${paymentData.orderId}`, order);
      if ((payment.status || '').toLowerCase() === 'completed') {
        const userProfile = await kv.get(`user:${user.id}`);
        await sendOrderEmail(order, userProfile?.email || 'customer@example.com', userProfile?.name);
      }
    }
  }

    return c.json({ success: true, payment });
  } catch (error) {
    console.log('Create payment error:', error);
    return c.json({ error: 'Failed to create payment' }, 500);
  }
});

app.put('/make-server-52d68140/payments/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile || userProfile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const id = c.req.param('id');
    const payment = await kv.get(`payment:${id}`);

    if (!payment) {
      return c.json({ error: 'Payment not found' }, 404);
    }

    const updates = await c.req.json();
  const updatedPayment = { ...payment, ...updates, updatedAt: new Date().toISOString() };

  await kv.set(`payment:${id}`, updatedPayment);

  if (updates.status && payment.orderId) {
    const order = await kv.get(`order:${payment.orderId}`);
    if (order) {
      order.paymentStatus = updates.status;
      await kv.set(`order:${payment.orderId}`, order);
      if ((updates.status || '').toLowerCase() === 'completed') {
        const userProfile = await kv.get(`user:${payment.userId}`);
        await sendOrderEmail(order, userProfile?.email || 'customer@example.com', userProfile?.name);
      }
    }
  }

    return c.json({ success: true, payment: updatedPayment });
  } catch (error) {
    console.log('Update payment error:', error);
    return c.json({ error: 'Failed to update payment' }, 500);
  }
});
// Admin cleanup: wipe KV data (excluding users by default)
app.post('/make-server-52d68140/admin/cleanup', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const profile = await kv.get(`user:${user.id}`);
    if (!profile || profile.role !== 'admin') return c.json({ error: 'Admin access required' }, 403);

    const body = await c.req.json().catch(() => ({}));
    const includeUsers = !!body?.includeUsers;
    const onlyPrefixes: string[] = Array.isArray(body?.prefixes) ? body.prefixes : [];

    let prefixes = [
      'product:', 'order:', 'cart:', 'wishlist:',
      'testimonial:', 'gallery:', 'faq:', 'contact:',
      'video:', 'video-like:', 'video-comment:',
      'notification:', 'payment:', 'reset:', 'reset-email:'
    ];
    if (includeUsers) prefixes.push('user:');
    if (onlyPrefixes.length > 0) {
      prefixes = prefixes.filter(p => onlyPrefixes.includes(p));
    }

    const result: Record<string, number> = {};
    for (const p of prefixes) {
      // obtain real keys from KV table
      const pairs = await (kv as any).getKeysByPrefix(p);
      let count = 0;
      for (const pair of pairs) { await kv.del(pair.key); count++; }
      result[p] = count;
    }

    return c.json({ success: true, deleted: result, note: includeUsers ? 'Users cleared too' : 'Users retained' });
  } catch (e) {
    console.log('Admin cleanup error', e);
    return c.json({ error: 'Cleanup failed' }, 500);
  }
});
