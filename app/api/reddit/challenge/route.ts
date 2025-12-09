import { NextResponse } from 'next/server';
import { RedditController } from '@/lib/reddit-controller';

export async function POST(req: Request) {
    try {
        const challenge = await RedditController.generateChallenge();
        return NextResponse.json({ challenge });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
