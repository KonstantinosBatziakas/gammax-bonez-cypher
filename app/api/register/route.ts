import {NextRequest,NextResponse} from 'next/server';
export const runtime='nodejs';
function validEmail(v:string){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)}
export async function POST(req:NextRequest){
 try {
  const b=await req.json();
  const stageName=String(b.stageName||'').trim(), email=String(b.email||'').trim(),instagram=String(b.instagram||'').trim(),message=String(b.message||'').trim();
  if(!stageName||stageName.length>80||!validEmail(email)||email.length>254||instagram.length>80||message.length>1000||b.agree!=='yes')return NextResponse.json({error:'Invalid form data'},{status:400});
  const turnstileSecret=process.env.TURNSTILE_SECRET_KEY;
  if(!turnstileSecret)return NextResponse.json({error:'Bot protection not configured'},{status:503});
  const verification=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({secret:turnstileSecret,response:String(b.turnstileToken||'')})});
  const verdict=await verification.json();
  if(!verdict.success)return NextResponse.json({error:'Bot verification failed'},{status:403});
  const url=process.env.GOOGLE_SCRIPT_WEB_APP_URL,secret=process.env.GOOGLE_SCRIPT_SHARED_SECRET;
  if(!url||!secret||!url.startsWith('https://script.google.com/'))return NextResponse.json({error:'Email backend not configured'},{status:503});
  const response=await fetch(url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({secret,stageName,email,instagram,message}),redirect:'follow',cache:'no-store',signal:AbortSignal.timeout(15000)});
  if(!response.ok)return NextResponse.json({error:'Email backend failed'},{status:502});
  const result=await response.json();
  if(result.ok!==true)return NextResponse.json({error:'Email backend rejected registration'},{status:502});
  return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:'Unable to submit registration'},{status:500})}
}
