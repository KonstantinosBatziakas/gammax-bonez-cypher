import {NextRequest,NextResponse} from 'next/server';
export const runtime='nodejs';

function validEmail(v:string){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)}

export async function POST(req:NextRequest){
 try {
  const b=await req.json();
  const stageName=String(b.stageName||'').trim();
  const email=String(b.email||'').trim().toLowerCase();
  const instagram=String(b.instagram||'').trim();
  const message=String(b.message||'').trim();

  if(!stageName||stageName.length>80||!validEmail(email)||email.length>254||instagram.length>80||message.length>1000||b.agree!=='yes'){
   return NextResponse.json({error:'Invalid form data'},{status:400});
  }

  const turnstileSecret=process.env.TURNSTILE_SECRET_KEY;
  if(!turnstileSecret)return NextResponse.json({error:'Bot protection not configured'},{status:503});

  const verification=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{
   method:'POST',
   headers:{'Content-Type':'application/x-www-form-urlencoded'},
   body:new URLSearchParams({secret:turnstileSecret,response:String(b.turnstileToken||'')}),
   cache:'no-store'
  });
  const verdict=await verification.json();
  if(!verdict.success)return NextResponse.json({error:'Bot verification failed'},{status:403});

  const supabaseUrl=process.env.SUPABASE_URL;
  const supabaseSecret=process.env.SUPABASE_SECRET_KEY;
  if(!supabaseUrl||!supabaseSecret)return NextResponse.json({error:'Registration backend not configured'},{status:503});

  const response=await fetch(`${supabaseUrl.replace(/\/$/,'')}/rest/v1/registrations`,{
   method:'POST',
   headers:{
    'Content-Type':'application/json',
    'apikey':supabaseSecret,
    'Authorization':`Bearer ${supabaseSecret}`,
    'Prefer':'return=minimal'
   },
   body:JSON.stringify({stage_name:stageName,email,instagram:instagram||null,message:message||null,status:'Pending'}),
   cache:'no-store',
   signal:AbortSignal.timeout(15000)
  });

  if(response.status===409)return NextResponse.json({error:'This email is already registered'},{status:409});
  if(!response.ok){
   console.error('Supabase registration failed',{status:response.status,body:(await response.text()).slice(0,500)});
   return NextResponse.json({error:'Unable to save registration'},{status:502});
  }

  return NextResponse.json({ok:true});
 }catch(error){
  console.error('Registration request failed',error);
  return NextResponse.json({error:'Unable to submit registration'},{status:500});
 }
}
