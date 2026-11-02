import {NextRequest,NextResponse} from 'next/server';
import {randomBytes} from 'crypto';
export const runtime='nodejs';

function validEmail(v:string){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)}
function normalizeInstagram(v:string){
 const raw=v.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i,'').replace(/\/$/,'');
 const username=raw.startsWith('@')?raw.slice(1):raw;
 return /^[A-Za-z0-9._]{1,30}$/.test(username)?'@'+username.toLowerCase():'';
}

export async function POST(req:NextRequest){
 try{
  const b=await req.json();
  const stageName=String(b.stageName||'').trim();
  const email=String(b.email||'').trim().toLowerCase();
  const instagram=normalizeInstagram(String(b.instagram||''));
  const message=String(b.message||'').trim();
  const lyrics=String(b.lyrics||'').trim();
  const language=b.language==='el'?'el':'en';

  if(!stageName||stageName.length>80||!validEmail(email)||email.length>254||!instagram||message.length>1000||lyrics.length>4000||b.agree!=='yes')
   return NextResponse.json({error:'Invalid form data'},{status:400});

  const turnstileSecret=process.env.TURNSTILE_SECRET_KEY;
  if(!turnstileSecret)return NextResponse.json({error:'Bot protection not configured'},{status:503});
  const verification=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({secret:turnstileSecret,response:String(b.turnstileToken||'')}),cache:'no-store'});
  const verdict=await verification.json();
  if(!verdict.success)return NextResponse.json({error:'Bot verification failed'},{status:403});

  const supabaseUrl=process.env.SUPABASE_URL?.replace(/\/$/,'');
  const secret=process.env.SUPABASE_SECRET_KEY;
  if(!supabaseUrl||!secret)return NextResponse.json({error:'Registration backend not configured'},{status:503});
  const headers={'Content-Type':'application/json','apikey':secret,'Authorization':`Bearer ${secret}`};

  const insert=await fetch(`${supabaseUrl}/rest/v1/registrations`,{method:'POST',headers:{...headers,'Prefer':'return=minimal'},body:JSON.stringify({stage_name:stageName,email,instagram,message:message||null,lyrics:lyrics||null,language,email_verified:false,status:'Pending'}),cache:'no-store'});
  if(insert.status===409)return NextResponse.json({error:'This email is already registered'},{status:409});
  if(!insert.ok){console.error('Registration insert failed',insert.status,(await insert.text()).slice(0,500));return NextResponse.json({error:'Unable to save registration'},{status:502});}

  const origin=new URL(req.url).origin;
  const signup=await fetch(`${supabaseUrl}/auth/v1/signup?redirect_to=${encodeURIComponent(origin+'/api/confirm')}`,{method:'POST',headers,body:JSON.stringify({email,password:randomBytes(32).toString('base64url'),data:{language,stage_name:stageName}}),cache:'no-store'});
  if(!signup.ok){
   console.error('Confirmation email failed',signup.status,(await signup.text()).slice(0,500));
   await fetch(`${supabaseUrl}/rest/v1/registrations?email=eq.${encodeURIComponent(email)}&email_verified=eq.false`,{method:'DELETE',headers,cache:'no-store'});
   return NextResponse.json({error:'Unable to send confirmation email'},{status:502});
  }
  return NextResponse.json({ok:true});
 }catch(error){console.error('Registration request failed',error);return NextResponse.json({error:'Unable to submit registration'},{status:500})}
}
