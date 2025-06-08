const { createClient } = require('@supabase/supabase-js');
const formidable = require('formidable');

// Initialize Supabase client with service key (bypasses RLS)
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      maxFileSize: 5 * 1024 * 1024, // 5MB
    });

    const [fields, files] = await form.parse(req);
    
    const userId = fields.userId?.[0];
    const file = files.photo?.[0];

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No photo file provided'
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Generate filename
    const fileExt = file.originalFilename?.split('.').pop() || 'jpg';
    const fileName = `${userId}/profile.${fileExt}`;

    // Read file buffer
    const fs = require('fs');
    const fileBuffer = fs.readFileSync(file.filepath);

    // Upload to Supabase storage using service key (bypasses RLS)
    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(fileName, fileBuffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return res.status(500).json({
        success: false,
        error: `Upload failed: ${uploadError.message}`
      });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(fileName);

    console.log(`✅ Photo uploaded successfully for user ${userId} - URL: ${publicUrl}`);

    res.json({
      success: true,
      photoUrl: publicUrl,
      message: 'Photo uploaded successfully!'
    });

  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
} 