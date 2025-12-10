import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function GET(request: Request) {
    try {
        // Get the userId and brandId from query params
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const brandId = searchParams.get('brandId');

        console.log('[GetBusinessOverview] Request params:', { userId, brandId });

        if (!userId || !brandId) {
            console.error('[GetBusinessOverview] Missing params:', { userId, brandId });
            return NextResponse.json(
                { error: 'User ID and Brand ID are required' },
                { status: 400 }
            );
        }

        // Fetch brand data from Firestore using client SDK (same as profile page)
        const brandRef = doc(db, 'users', userId, 'brands', brandId);
        const brandSnap = await getDoc(brandRef);

        console.log('[GetBusinessOverview] Brand exists:', brandSnap.exists());

        if (!brandSnap.exists()) {
            console.error('[GetBusinessOverview] Brand not found:', { userId, brandId });
            return NextResponse.json(
                { error: 'Brand not found' },
                { status: 404 }
            );
        }

        const brandData = brandSnap.data();
        console.log('[GetBusinessOverview] Brand data keys:', Object.keys(brandData || {}));
        console.log('[GetBusinessOverview] Has business_overview:', !!brandData?.business_overview);

        const businessOverview = brandData?.business_overview || '';

        if (!businessOverview) {
            console.log('[GetBusinessOverview] No business overview found');
            return NextResponse.json({
                businessOverview: '',
                hasOverview: false,
                message: 'No business overview found for this brand. Please add one in your brand settings.',
                brandName: brandData?.brand_name || 'Your Brand'
            });
        }

        console.log('[GetBusinessOverview] Success! Business overview length:', businessOverview.length);

        return NextResponse.json({
            businessOverview,
            hasOverview: true,
            brandName: brandData?.brand_name || 'Your Brand'
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[GetBusinessOverview] Error:', errorMessage);
        console.error('[GetBusinessOverview] Error stack:', error instanceof Error ? error.stack : 'No stack');

        return NextResponse.json(
            { error: 'Failed to fetch business overview', details: errorMessage },
            { status: 500 }
        );
    }
}
