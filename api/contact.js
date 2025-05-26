import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  console.log('Contact function called with method:', req.method);
  
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

  try {
    console.log('Request body:', req.body);
    
    // Check if body exists and is parsed
    if (!req.body) {
      console.log('No request body found');
      return res.status(400).json({ error: 'No data received' });
    }

    const { name, email, company, service, message } = req.body;
    
    console.log('Extracted fields:', { name, email, company, service, message });

    // Basic validation
    if (!name || !email || !message) {
      console.log('Validation failed:', { 
        hasName: !!name, 
        hasEmail: !!email, 
        hasMessage: !!message 
      });
      return res.status(400).json({ 
        error: 'Missing required fields: name, email, and message are required'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if required environment variables are configured
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY environment variable not set');
      return res.status(500).json({ 
        error: 'Email service not configured properly'
      });
    }

    if (!process.env.YOUR_EMAIL) {
      console.error('❌ YOUR_EMAIL environment variable not set');
      return res.status(500).json({ 
        error: 'Email recipient not configured properly'
      });
    }

    // Prepare email content
    const emailSubject = `New Contact Form Submission from ${name}`;
    const emailContent = `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Company:</strong> ${company || 'Not provided'}</p>
      <p><strong>Service Interest:</strong> ${service || 'Not specified'}</p>
      <p><strong>Message:</strong></p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
        ${message.replace(/\n/g, '<br>')}
      </div>
      <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
    `;

    try {
      // Send email notification to you
      const emailResponse = await resend.emails.send({
        from: 'Contact Form <onboarding@resend.dev>', // Using Resend sandbox domain
        to: [process.env.YOUR_EMAIL], // Your email from environment variable
        subject: emailSubject,
        html: emailContent,
        replyTo: email // This allows you to reply directly to the customer
      });

      console.log('✅ Email sent successfully:', emailResponse);

      // Optionally send a confirmation email to the customer
      const confirmationResponse = await resend.emails.send({
        from: 'Nirvijay & Co <onboarding@resend.dev>', // Using Resend sandbox domain
        to: [email],
        subject: 'Thank you for contacting Nirvijay & Co',
        html: `
          <h2>Thank you for your inquiry!</h2>
          <p>Dear ${name},</p>
          <p>Thank you for reaching out to Nirvijay & Co. We have received your message and will get back to you within 24 hours.</p>
          <p><strong>Your submitted information:</strong></p>
          <ul>
            <li><strong>Service Interest:</strong> ${service || 'General inquiry'}</li>
            <li><strong>Company:</strong> ${company || 'Not specified'}</li>
          </ul>
          <p>In the meantime, feel free to check out our services at our website.</p>
          <p>Best regards,<br>
          Arya Podar<br>
          ACCA Certified Professional<br>
          Nirvijay & Co</p>
        `
      });

      console.log('✅ Confirmation email sent:', confirmationResponse);

    } catch (emailError) {
      console.error('❌ Error sending email:', emailError);
      
      // Still log the submission for manual follow-up
      console.log('📝 Manual follow-up required for:', {
        name, email, company, service, message,
        timestamp: new Date().toISOString()
      });

      return res.status(500).json({ 
        error: 'Failed to send email notification',
        message: 'Your message was received but we could not send email confirmation. We will still follow up manually.'
      });
    }

    // Log successful submission
    console.log('✅ Contact form submission processed successfully:', {
      name,
      email,
      company: company || 'Not provided',
      service: service || 'Not specified',
      messageLength: message.length,
      timestamp: new Date().toISOString()
    });

    // Send success response
    res.status(200).json({ 
      success: true, 
      message: 'Your message has been received! We will get back to you within 24 hours.',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error in contact function:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      error: 'Server error occurred',
      message: 'Please try again or contact us directly via email'
    });
  }
}