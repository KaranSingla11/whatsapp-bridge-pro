# WhatsApp Bridge Chat Widget - User Guide

## Overview
The WhatsApp Bridge Chat Widget is a Tawk.to-style embed script that allows API users to add a WhatsApp chatbot to their websites.

## Features
✅ Floating green WhatsApp chat bubble  
✅ Click to open/close conversation  
✅ Visitors enter phone number and message  
✅ Messages sent directly to your WhatsApp instance  
✅ Mobile responsive  
✅ Works on any website  
✅ Zero dependencies  

## How to Use (3 Steps)

### Step 1: Get Your API Key
1. Go to **API Keys** section
2. Click **"Generate Key"** button
3. Copy the generated API key

### Step 2: Get Your Instance ID
1. Go to **Instances** section
2. Find the WhatsApp instance you want to use
3. Copy the instance ID

### Step 3: Add to Your Website
Copy the embed code and paste it before the closing `</body>` tag on your website.

## Installation Methods

### Method 1: Simple Script Tag (Easiest)
```html
<script src="http://localhost:3000/embed/chat-widget.js?apiKey=YOUR_API_KEY&instanceId=YOUR_INSTANCE_ID"></script>
```

### Method 2: Dynamic Loading (Recommended)
```html
<script type="text/javascript">
(function() {
  var script = document.createElement('script');
  script.src = 'http://localhost:3000/embed/chat-widget.js?apiKey=YOUR_API_KEY&instanceId=YOUR_INSTANCE_ID';
  script.async = true;
  script.charset = 'UTF-8';
  script.setAttribute('crossorigin', '*');
  document.body.appendChild(script);
})();
</script>
```

### Method 3: With Custom API URL
```html
<script src="http://yourdomain.com/embed/chat-widget.js?apiKey=YOUR_API_KEY&instanceId=YOUR_INSTANCE_ID&apiUrl=http://yourdomain.com"></script>
```

## API Endpoint Details

### Endpoint
```
GET /embed/chat-widget.js
```

### Query Parameters
- **apiKey** (required): Your API key for authentication
- **instanceId** (required): WhatsApp instance ID where messages will be sent
- **apiUrl** (optional): Your API server URL (defaults to http://localhost:3000)

### Response
Returns a JavaScript file that creates a floating chat widget on the page.

## Widget UI/UX

### Chat Bubble (Default State)
- Green floating button in bottom-right corner
- WhatsApp icon
- Hover effect with scale animation
- Click to open/close

### Chat Window (Open State)
- Header: "Chat with us" + "Typically replies in minutes"
- Phone input field (for visitor's phone number)
- Message input field
- Send button
- Message history area
- Welcome greeting

### Message Flow
1. Visitor clicks green bubble
2. Enters their phone number (e.g., 919999999999)
3. Types message
4. Clicks send or presses Enter
5. Message appears in bubble as green chip
6. Message sent to your WhatsApp instance via API
7. You can reply directly in WhatsApp

## Example HTML Page

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Business Website</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        h1 { color: #333; }
        p { color: #666; line-height: 1.6; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to Our Business</h1>
        <p>We provide excellent services. Have a question? Chat with us using WhatsApp!</p>
        <p>Our team is ready to help you 24/7.</p>
    </div>

    <!-- WhatsApp Chat Widget - Add before closing body tag -->
    <script type="text/javascript">
    (function() {
        var script = document.createElement('script');
        script.src = 'http://localhost:3000/embed/chat-widget.js?apiKey=wa_live_abc123def456&instanceId=inst_webhook_12345';
        script.async = true;
        script.charset = 'UTF-8';
        script.setAttribute('crossorigin', '*');
        document.body.appendChild(script);
    })();
    </script>
</body>
</html>
```

## Security

✅ API Key Validation: Only valid API keys can load the widget  
✅ Instance Verification: Instance must exist in your WhatsApp Bridge account  
✅ CORS Enabled: Works across different domains  
✅ HTTPS Ready: Works with both HTTP and HTTPS websites  

## Troubleshooting

### Widget not appearing?
- Check API key is correct and active
- Check instance ID exists in your account
- Check browser console for errors (F12 → Console)
- Verify API server is running

### Messages not sending?
- Ensure WhatsApp instance is connected (status = "connected")
- Check phone number format (should be 10+ digits)
- Check API key has permissions

### Widget styling issues?
- Widget uses default Tailwind CSS styles
- Works in any modern browser (Chrome, Firefox, Safari, Edge)
- Mobile responsive - try on different screen sizes

## FAQ

**Q: Can I customize the widget colors?**  
A: Currently uses WhatsApp green (#25D366). Custom colors coming soon.

**Q: Does it work on mobile?**  
A: Yes! Fully responsive on all devices.

**Q: Can multiple instances use the same API key?**  
A: Yes, but each embed code must specify a different instanceId.

**Q: How many messages can I send?**  
A: Unlimited - limited only by your WhatsApp Business Account.

**Q: Does it work on HTTPS sites?**  
A: Yes, fully compatible with HTTPS.

---

Need help? Contact support@whatsappbridge.pro
