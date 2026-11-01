/**
 * GAMMAX x BONEZ Cypher Verse — free Gmail notifications.
 * Configure Script Property SHARED_SECRET in Project Settings.
 * Deploy as Web app, execute as Me, access Anyone.
 */
function doPost(e) {
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const secret = PropertiesService.getScriptProperties().getProperty('SHARED_SECRET');
    if (!secret || !data.secret || String(data.secret) !== secret) return json_({ok:false});
    const name = String(data.stageName || '').trim();
    const email = String(data.email || '').trim();
    const instagram = String(data.instagram || '').trim();
    const message = String(data.message || '').trim();
    if (!name || name.length > 80 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || instagram.length > 80 || message.length > 1000) return json_({ok:false});
    const subject = 'New Cypher Verse registration: ' + name.replace(/[\r\n]/g, ' ');
    const body = 'New GAMMAX x BONEZ Cypher Verse registration\n\n' +
      'Stage name: ' + name + '\nEmail: ' + email + '\nInstagram: ' + instagram + '\nMessage: ' + message;
    MailApp.sendEmail({to:'codinginquires1@gmail.com',subject:subject,body:body,replyTo:email,name:'Cypher Verse Registrations'});
    return json_({ok:true});
  } catch (err) {
    console.error('Registration notification failed');
    return json_({ok:false});
  }
}
function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
