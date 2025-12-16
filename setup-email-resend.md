# Quick Setup: Email Notifications with Resend

## Step 1: Sign Up for Resend (FREE)
1. Go to https://resend.com
2. Click "Start Building for Free"
3. Sign up with your email
4. Verify your email

## Step 2: Add Your Domain
1. In Resend dashboard, go to "Domains"
2. Click "Add Domain"
3. Enter: `decorizz.com`
4. Add the DNS records to your domain provider:
   - Add TXT record for verification
   - Add MX records for receiving
   - Add DKIM records for authentication

## Step 3: Get API Key
1. Go to "API Keys" in Resend dashboard
2. Click "Create API Key"
3. Name it: "Decorizz Orders"
4. Copy the API key (starts with `re_`)

## Step 4: Add API Key to Supabase
Run this command in your terminal:
```bash
npx supabase secrets set RESEND_API_KEY=re_your_api_key_here --project-ref wievhaxedotrhktkjupg
```

## Step 5: Enable Email Sending in Code
Open `src/supabase/functions/server/index.tsx` and find the `sendOrderEmail` function.

Uncomment these lines (around line 600):
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

## Step 6: Deploy
```bash
npx supabase functions deploy make-server-52d68140 --project-ref wievhaxedotrhktkjupg --no-verify-jwt
```

## Step 7: Test
1. Place a test order on your website
2. Check `order@decorizz.com` inbox
3. You should receive a beautiful email with order details!

## Troubleshooting

### Email not received?
- Check Resend dashboard logs
- Verify domain is verified (green checkmark)
- Check spam folder
- Verify API key is set correctly

### Check Supabase Logs
```bash
npx supabase functions logs make-server-52d68140 --project-ref wievhaxedotrhktkjupg
```

## Free Tier Limits
- ✅ 100 emails/day
- ✅ 3,000 emails/month
- ✅ Perfect for starting out!

## Alternative: Use Gmail (Quick Test)
If you just want to test quickly without domain setup:

1. In Resend, you can send from `onboarding@resend.dev`
2. Change the `from` email in code temporarily
3. Test the system
4. Later, set up your domain properly

## Email Template Preview
When an order is placed, you'll receive:
- 📧 Subject: "New Order Received - ORD-xxxxx"
- 🎨 Beautiful HTML email with:
  - Order ID and total
  - Customer details
  - Shipping address
  - Complete item list
  - Payment status
  - Action button to admin panel

## Production Checklist
- [ ] Domain verified in Resend
- [ ] DNS records added
- [ ] API key added to Supabase
- [ ] Code uncommented
- [ ] Function deployed
- [ ] Test order placed
- [ ] Email received successfully

---
**Estimated Setup Time:** 15-20 minutes
**Cost:** FREE (up to 3,000 emails/month)

