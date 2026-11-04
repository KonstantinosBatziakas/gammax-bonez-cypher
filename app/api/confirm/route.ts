import {NextRequest,NextResponse} from 'next/server';
import {createHmac,timingSafeEqual} from 'crypto';
export const runtime='nodejs';
function sign(v:string,k:string){return createHmac('sha256',k).update(v).digest('base64url')}
export async function GET(req:NextRequest){const url=new URL(req.url),email=String(url.searchParams.get('email')||'').trim().toLowerCase(),lang=url.searchParams.get('lang')==='el'?'el':'en',exp=Number(url.searchParams.get('exp')),sig=String(url.searchParams.get('sig')||''),home=new URL('/',url.origin);home.searchParams.set('lang',lang);const secret=process.env.SUPABASE_SECRET_KEY,base=process.env.SUPABASE_URL?.replace(/\/$/,'');if(!secret||!base||!email||!exp||exp<Math.floor(Date.now()/1000)){home.searchParams.set('confirmation','error');return NextResponse.redirect(home)}const expected=sign(email+'|'+lang+'|'+exp,secret);try{if(sig.length!==expected.length||!timingSafeEqual(Buffer.from(sig),Buffer.from(expected))){home.searchParams.set('confirmation','error');return NextResponse.redirect(home)}}catch{home.searchParams.set('confirmation','error');return NextResponse.redirect(home)}
const h={'Content-Type':'application/json','apikey':secret,'Authorization':'Bearer '+secret};const lookup=await fetch(base+'/rest/v1/registrations?email=eq.'+encodeURIComponent(email)+'&select=email_verified,status',{headers:h,cache:'no-store'});if(!lookup.ok){home.searchParams.set('confirmation','error');return NextResponse.redirect(home)}const rows=await lookup.json();if(!rows.length){home.searchParams.set('confirmation','error');return NextResponse.redirect(home)}if(rows[0].email_verified||rows[0].status==='Accepted'){home.searchParams.set('confirmation','success');return NextResponse.redirect(home)}
const update=await fetch(base+'/rest/v1/registrations?email=eq.'+encodeURIComponent(email)+'&email_verified=eq.false',{method:'PATCH',headers:{...h,'Prefer':'return=representation'},body:JSON.stringify({email_verified:true,verified_at:new Date().toISOString(),status:'Accepted'}),cache:'no-store'});if(!update.ok){home.searchParams.set('confirmation','error');return NextResponse.redirect(home)}
home.searchParams.set('confirmation','success');
// Notify the organizer only when the confirmation actually changed a row.
const updated=await update.json().catch(()=>[]);
if(Array.isArray(updated)&&updated.length>0){
  try{
    const details=await fetch(base+'/rest/v1/registrations?email=eq.'+encodeURIComponent(email)+'&select=stage_name,email,instagram,message,lyrics,language,verified_at',{headers:h,cache:'no-store'});
    if(details.ok&&process.env.RESEND_API_KEY){
      const participant=(await details.json())[0];
      if(participant){
        const clean=(v:unknown)=>String(v??'').replace(/[\\r\\n]+/g,' ').slice(0,4000);
        const body=['A participant confirmed their GAMMAX x BONEZ Cypher Verse registration.','','Stage name: '+clean(participant.stage_name),'Email: '+clean(participant.email),'Instagram: '+clean(participant.instagram),'Language: '+clean(participant.language),'Verified at: '+clean(participant.verified_at),'Message: '+clean(participant.message),'Lyrics: '+clean(participant.lyrics)].join('\\n');
        const sent=await fetch('https://api.resend.com/emails',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+process.env.RESEND_API_KEY},body:JSON.stringify({from:'GAMMAX x BONEZ <registrations@mail.autoreach.dev>',to:['codinginquires1@gmail.com'],subject:'New verified Cypher Verse registration: '+clean(participant.stage_name),text:body}),cache:'no-store'});
        if(!sent.ok)console.error('Organizer notification failed',sent.status);
      }
    }
  }catch(err){console.error('Organizer notification error',err)}
}
return NextResponse.redirect(home)}
