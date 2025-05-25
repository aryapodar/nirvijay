// Serverless function to handle contact form submissions
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, company, service, message } = req.body;

  // Basic validation
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // For now, we'll use Resend email service
    // You'll set up the API key in Vercel environment variables
    
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const YOUR_EMAIL = process.env.YOUR_EMAIL || 'aryapodar@gmail.com'; // Replace with your actual email

    if (!RESEND_API_KEY) {
      console.log('Contact form submission (email service not configured yet):', {
        name, email, company, service, message
      });
      return res.status(200).json({ 
        success: true, 
        message: 'Message received (email service setup pending)'
      });
    }

    // Send email using Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Contact Form <noreply@yourdomain.com>', // You'll update this later
        to: [YOUR_EMAIL],
        subject: `New Business Inquiry from ${name}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Company:</strong> ${company || 'Not specified'}</p>
          <p><strong>Service:</strong> ${service || 'Not specified'}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
          <hr>
          <p><small>This message was sent through the Nirvijay & Co contact form.</small></p>
        `,
        reply_to: email
      }),
    });

    if (!emailResponse.ok) {
      throw new Error('Failed to send email');
    }

    res.status(200).json({ success: true, message: 'Message sent successfully' });
    
  } catch (error) {
    console.error('Error processing contact form:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
}