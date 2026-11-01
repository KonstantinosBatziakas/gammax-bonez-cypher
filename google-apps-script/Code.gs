/**
 * GAMMAX x BONEZ registration notifications + optional Google Sheets log.
 *
 * Script Properties:
 * SHARED_SECRET (required): same value as Vercel GOOGLE_SCRIPT_SHARED_SECRET
 * SPREADSHEET_ID (optional): ID from the Google Sheets URL.
 *
 * Deploy Web app as "Execute as Me", access "Anyone".
 * After editing, deploy a NEW VERSION of the existing deployment.
 */
const HEADERS = ['Registration ID','Received at','Stage name','Email','Instagram','Message','Status'];
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const props = PropertiesService.getScriptProperties();
    const secret = props.getProperty('SHARED_SECRET');
    if (!secret || !data.secret || String(data.secret) !== secret) return json_({ok:false,error:'unauthorized'});
    const name = String(data.stageName || '').trim();
    const email = String(data.email || '').trim().toLowerCase();
    const instagram = String(data.instagram || '').trim();
    const message = String(data.message || '').trim();
    if (!name || name.length > 80 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || instagram.length > 80 || message.length > 1000) return json_({ok:false,error:'invalid'});
    if (!lock.tryLock(10000)) return json_({ok:false,error:'busy'});
    const id = Utilities.getUuid();
    const sheetId = props.getProperty('SPREADSHEET_ID');
    let sheet = null;
    if (sheetId) {
      const spreadsheet = SpreadsheetApp.openById(sheetId);
      sheet = spreadsheet.getSheetByName('Registrations') || spreadsheet.insertSheet('Registrations');
      if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
      // Prevent accidental duplicate registrations from the same email address.
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        const emails = sheet.getRange(2,4,lastRow-1,1).getDisplayValues();
        if (emails.some(row => String(row[0]).trim().toLowerCase() === email)) return json_({ok:false,error:'duplicate'});
      }
      sheet.appendRow([id,new Date(),safeCell_(name),safeCell_(email),safeCell_(instagram),safeCell_(message),'Pending']);
    }
    const subject = 'New Cypher Verse registration: ' + name.replace(/[\r\n]/g,' ');
    const body = 'New GAMMAX x BONEZ Cypher Verse registration\n\n' +
      'Registration ID: ' + id + '\nStage name: ' + name + '\nEmail: ' + email +
      '\nInstagram: ' + instagram + '\nMessage: ' + message +
      '\nStatus: Pending';
    try {
      MailApp.sendEmail({to:'codinginquires1@gmail.com',subject,body,replyTo:email,name:'Cypher Verse Registrations'});
    } catch (mailError) {
      // The sheet has the registration; don't tell the participant it failed and cause duplicate retries.
      if (!sheet) throw mailError;
      console.error('Saved to sheet but email notification failed: ' + id);
    }
    return json_({ok:true});
  } catch (err) {
    console.error('Registration processing failed',err);
    return json_({ok:false,error:'processing'});
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}
function safeCell_(value) {
  const v = String(value);
  return /^[\s]*[=+\-@]/.test(v) ? "'" + v : v;
}
function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
