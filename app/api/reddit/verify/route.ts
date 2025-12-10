import { NextResponse } from 'next/server';
import { RedditController } from '@/lib/reddit-controller';

export async function POST(req: Request) {
    try {
        const { redditUsername, challenge } = await req.json();

        if (!redditUsername || !challenge) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const success = await RedditController.verifyOwnership(redditUsername, challenge);

        if (success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({
                success: false,
                error: 'Verification failed. Challenge code not found in Reddit bio.'
            }, { status: 400 });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
