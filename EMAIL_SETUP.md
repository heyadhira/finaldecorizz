# Email Notification Setup for Decorizz

## Overview
When a customer places an order, an email notification is sent to `order@decorizz.com` with complete order details.

## Current Implementation
The email notification system is built into the backend (`src/supabase/functions/server/index.tsx`).

Currently, it **logs** the email content to console. To enable actual email sending, you need to integrate with an email service.

## Recommended Email Services

### Option 1: Resend (Recommended - Easy & Free tier)
1. Sign up at https://resend.com
2. Verify your domain `decorizz.com`
3. Get your API key
4. Add to Supabase secrets:
   ```bash
   npx supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```
5. Uncomment the Resend code in `sendOrderEmail` function

### Option 2: SendGrid
1. Sign up at https://sendgrid.com
2. Verify sender email `order@decorizz.com`
3. Get API key
4. Add to Supabase secrets:
   ```bash
   npx supabase secrets set SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
   ```

### Option 3: AWS SES
1. Set up AWS SES
2. Verify `order@decorizz.com`
3. Add credentials to Supabase secrets

## Email Template Features
✅ Professional HTML design
✅ Order details (ID, total, status)
✅ Customer information
✅ Shipping address
✅ Complete item list with prices
✅ Responsive design
✅ Branded with Decorizz colors

## Email Content Includes:
- Order ID
- Customer email
- Total amount
- Payment status
- Order date & time
- Complete shipping address
- All ordered items with:
  - Product name
  - Size & color
  - Quantity & price
  - Subtotal per item

## Testing
1. Place a test order
2. Check Supabase function logs:
   ```bash
   npx supabase functions logs make-server-52d68140
   ```
3. You'll see the email content logged

## Production Setup
1. Choose an email service (Resend recommended)
2. Set up domain verification
3. Add API key to Supabase secrets
4. Uncomment email sending code
5. Deploy function:
   ```bash
   npx supabase functions deploy make-server-52d68140
   ```

## Email Service Integration Code

### For Resend:
```typescript
const response = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(emailContent)
});
```

### For SendGrid:
```typescript
const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    personalizations: [{ to: [{ email: emailContent.to }] }],
    from: { email: emailContent.from },
    subject: emailContent.subject,
    content: [{ type: 'text/html', value: emailContent.html }]
  })
});
```

## Support
For issues, check:
1. Supabase function logs
2. Email service dashboard
3. Domain verification status
4. API key validity

## Next Steps
1. ✅ Email template created
2. ✅ Email function integrated
3. ⏳ Choose email service
4. ⏳ Set up domain verification
5. ⏳ Add API key
6. ⏳ Enable email sending
7. ⏳ Test with real order

---
**Note:** Email is currently in LOG mode. Follow steps above to enable actual sending.

