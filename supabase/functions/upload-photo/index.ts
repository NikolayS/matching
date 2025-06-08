import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    const photo = formData.get('photo') as File
    const userId = formData.get('userId') as string

    if (!photo) {
      return new Response(
        JSON.stringify({ success: false, error: 'No photo file provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'User ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Generate filename
    const fileExt = photo.name.split('.').pop() || 'jpg'
    const fileName = `${userId}/profile.${fileExt}`

    // Initialize Supabase with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Convert file to array buffer
    const fileBuffer = await photo.arrayBuffer()
    const uint8Array = new Uint8Array(fileBuffer)

    // Upload to Supabase storage using service key (bypasses RLS)
    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(fileName, uint8Array, {
        contentType: photo.type,
        upsert: true
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return new Response(
        JSON.stringify({ success: false, error: `Upload failed: ${uploadError.message}` }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(fileName)

    console.log(`✅ Photo uploaded successfully for user ${userId} - URL: ${publicUrl}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        photoUrl: publicUrl,
        message: 'Photo uploaded successfully!'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Photo upload error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 