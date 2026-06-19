import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { folder, timestamp } = body;

    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;

    if (!apiSecret || !apiKey) {
      return NextResponse.json({ error: 'Cloudinary no está configurado' }, { status: 500 });
    }

    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
    const signature = crypto
      .createHash('sha1')
      .update(paramsToSign + apiSecret)
      .digest('hex');

    return NextResponse.json({
      signature,
      timestamp,
      api_key: apiKey,
    });
  } catch (error: any) {
    console.error('[Sign API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error generando firma' },
      { status: 500 }
    );
  }
}
