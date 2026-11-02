import {NextRequest,NextResponse} from 'next/server';
export const runtime='nodejs';

export async function GET(req:NextRequest){
 const url=new URL(req.url);
 const tokenHash=url.searchParams.get('token_hash');
 const type=url.searchParams.get('type')||'email';
 const lang=url.searchParams.get('lang')==='el'?'el':'en';
 const home=new URL('/',url.origin);
 if(!tokenHash){home.searchParams.set('confirmation','error');home.searchParams.set('lang',lang);return NextResponse.redirect(home)}
 const supabaseUrl=process.env.SUPABASE_URL?.replace(/\/$/,'');
 const secret=process.env.SUPABASE_SECRET_KEY;
 if(!supabaseUrl||!secret){home.searchParams.set('confirmation','error');return NextResponse.redirect(home)}
 const headers={'Content-Type':'application/json','apikey':secret,'Authorization':`Bearer ${secret}`};
 try{
  const verify=await fetch(`${supabaseUrl}/auth/v1/verify`,{method:'POST',headers,body:JSON.stringify({token_hash:tokenHash,type}),cache:'no-store'});
  if(!verify.ok){home.searchParams.set('confirmation','error');home.searchParams.set('lang',lang);return NextResponse.redirect(home)}
  const data=await verify.json();
  const email=String(data?.user?.email||'').toLowerCase();
  const language=data?.user?.user_metadata?.language==='el'?'el':'en';
  if(!email){home.searchParams.set('confirmation','error');home.searchParams.set('lang',language);return NextResponse.redirect(home)}
  const update=await fetch(`${supabaseUrl}/rest/v1/registrations?email=eq.${encodeURIComponent(email)}`,{method:'PATCH',headers:{...headers,'Prefer':'return=minimal'},body:JSON.stringify({email_verified:true,verified_at:new Date().toISOString(),status:'Accepted'}),cache:'no-store'});
  home.searchParams.set('confirmation',update.ok?'success':'error');
  home.searchParams.set('lang',language);
  return NextResponse.redirect(home);
 }catch{home.searchParams.set('confirmation','error');home.searchParams.set('lang',lang);return NextResponse.redirect(home)}
}
