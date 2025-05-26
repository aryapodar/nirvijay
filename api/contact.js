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
    console.log('Request headers:', req.headers);
    
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

    // Log successful submission
    console.log('✅ Contact form submission received:', {
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