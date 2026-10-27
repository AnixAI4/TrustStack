/**
 * TrustStack™ Consent Widget v1.0
 * DPDP Section 6 compliant consent collection
 * Usage: <script src="https://app.truststack.in/consent-widget.js" data-org="your-slug" data-lang="auto" async></script>
 */
(function () {
  'use strict';

  var script = document.currentScript || (function () {
    var s = document.getElementsByTagName('script');
    return s[s.length - 1];
  })();

  var ORG = script.getAttribute('data-org');
  var LANG_PREF = script.getAttribute('data-lang') || 'auto';
  if (!ORG) return;

  // Derive API base from where THIS script was loaded — not from window.location.
  // window.location.hostname is "" when page is opened via file://, so we cannot use it.
  var API = (function () {
    try {
      var src = script.src; // fully-resolved URL e.g. "http://localhost:3011/consent-widget.js"
      if (src && (src.indexOf('localhost') !== -1 || src.indexOf('127.0.0.1') !== -1)) {
        var u = new URL(src);
        return u.protocol + '//' + u.host; // "http://localhost:3011"
      }
    } catch (e) {}
    return 'https://app.truststack.in';
  })();

  var STORAGE_KEY = 'ts_consent_' + ORG;
  var UID_KEY = 'ts_uid_' + ORG;

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  // Note: returning visitors are NOT short-circuited here. The boot block at the
  // bottom shows a floating "Privacy choices" button so they can re-open the
  // banner or withdraw consent.

  var T = {
    en: { title: 'We value your privacy', desc: 'We use cookies and process your personal data in accordance with the Digital Personal Data Protection Act 2023.', accept: 'Accept All', reject: 'Reject All', manage: 'Manage Preferences', save: 'Save My Choices', required: 'Required', withdraw: 'You can withdraw consent at any time.' },
    hi: { title: 'हम आपकी गोपनीयता को महत्व देते हैं', desc: 'हम डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम 2023 के अनुसार कुकीज़ और आपका व्यक्तिगत डेटा उपयोग करते हैं।', accept: 'सभी स्वीकार करें', reject: 'सभी अस्वीकार करें', manage: 'प्राथमिकताएं प्रबंधित करें', save: 'मेरी पसंद सहेजें', required: 'आवश्यक', withdraw: 'आप किसी भी समय सहमति वापस ले सकते हैं।' },
    ta: { title: 'உங்கள் தனியுரிமையை மதிக்கிறோம்', desc: 'டிஜிட்டல் தனிப்பட்ட தரவு பாதுகாப்பு சட்டம் 2023 இன்படி குக்கீகள் மற்றும் தரவை பயன்படுத்துகிறோம்.', accept: 'அனைத்தையும் ஏற்றுக்கொள்', reject: 'அனைத்தையும் நிராகரி', manage: 'விருப்பங்களை நிர்வகி', save: 'என் தேர்வுகளை சேமி', required: 'தேவையான', withdraw: 'நீங்கள் எந்த நேரத்திலும் ஒப்புதலை திரும்பப் பெறலாம்.' },
    te: { title: 'మీ గోప్యతను గౌరవిస్తాము', desc: 'డిజిటల్ వ్యక్తిగత డేటా రక్షణ చట్టం 2023 ప్రకారం కుకీలు మరియు డేటాను ఉపయోగిస్తాము.', accept: 'అన్నీ అంగీకరించు', reject: 'అన్నీ తిరస్కరించు', manage: 'ప్రాధాన్యతలు నిర్వహించు', save: 'నా ఎంపికలు సేవ్ చేయి', required: 'అవసరం', withdraw: 'మీరు ఎప్పుడైనా సమ్మతిని ఉపసంహరించవచ్చు.' },
    mr: { title: 'आम्ही तुमच्या गोपनीयतेचा आदर करतो', desc: 'आम्ही डिजिटल वैयक्तिक डेटा संरक्षण कायदा 2023 नुसार कुकीज आणि तुमचा वैयक्तिक डेटा वापरतो.', accept: 'सर्व स्वीकारा', reject: 'सर्व नाकारा', manage: 'प्राधान्ये व्यवस्थापित करा', save: 'माझ्या निवडी जतन करा', required: 'आवश्यक', withdraw: 'तुम्ही कधीही संमती मागे घेऊ शकता.' },
    gu: { title: 'અમે તમારી ગોપનીયતાનું સન્માન કરીએ છીએ', desc: 'અમે ડિજિટલ વ્યક્તિગત ડેટા સંરક્ષણ અધિનિયમ 2023 અનુસાર કૂકીઝ અને તમારો વ્યક્તિગત ડેટા વાપરીએ છીએ.', accept: 'બધું સ્વીકારો', reject: 'બધું નકારો', manage: 'પસંદગીઓ સંચાલિત કરો', save: 'મારી પસંદગીઓ સાચવો', required: 'આવશ્યક', withdraw: 'તમે કોઈપણ સમયે સંમતિ પાછી ખેંચી શકો છો.' },
    bn: { title: 'আমরা আপনার গোপনীয়তাকে মূল্য দিই', desc: 'আমরা ডিজিটাল ব্যক্তিগত তথ্য সুরক্ষা আইন 2023 অনুযায়ী কুকি এবং আপনার ব্যক্তিগত তথ্য ব্যবহার করি।', accept: 'সব গ্রহণ করুন', reject: 'সব প্রত্যাখ্যান করুন', manage: 'পছন্দ পরিচালনা করুন', save: 'আমার পছন্দ সংরক্ষণ করুন', required: 'আবশ্যক', withdraw: 'আপনি যেকোনো সময় সম্মতি প্রত্যাহার করতে পারেন।' },
    kn: { title: 'ನಿಮ್ಮ ಗೌಪ್ಯತೆಯನ್ನು ನಾವು ಗೌರವಿಸುತ್ತೇವೆ', desc: 'ಡಿಜಿಟಲ್ ವೈಯಕ್ತಿಕ ದತ್ತಾಂಶ ಸಂರಕ್ಷಣಾ ಕಾಯ್ದೆ 2023 ರ ಪ್ರಕಾರ ನಾವು ಕುಕೀಗಳು ಮತ್ತು ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ದತ್ತಾಂಶವನ್ನು ಬಳಸುತ್ತೇವೆ.', accept: 'ಎಲ್ಲವನ್ನೂ ಸ್ವೀಕರಿಸಿ', reject: 'ಎಲ್ಲವನ್ನೂ ತಿರಸ್ಕರಿಸಿ', manage: 'ಆದ್ಯತೆಗಳನ್ನು ನಿರ್ವಹಿಸಿ', save: 'ನನ್ನ ಆಯ್ಕೆಗಳನ್ನು ಉಳಿಸಿ', required: 'ಅಗತ್ಯವಿದೆ', withdraw: 'ನೀವು ಯಾವುದೇ ಸಮಯದಲ್ಲಿ ಸಮ್ಮತಿಯನ್ನು ಹಿಂಪಡೆಯಬಹುದು.' },
    ml: { title: 'ഞങ്ങൾ നിങ്ങളുടെ സ്വകാര്യതയെ വിലമതിക്കുന്നു', desc: 'ഡിജിറ്റൽ വ്യക്തിഗത ഡാറ്റ സംരക്ഷണ നിയമം 2023 അനുസരിച്ച് ഞങ്ങൾ കുക്കികളും നിങ്ങളുടെ വ്യക്തിഗത ഡാറ്റയും ഉപയോഗിക്കുന്നു.', accept: 'എല്ലാം സ്വീകരിക്കുക', reject: 'എല്ലാം നിരസിക്കുക', manage: 'മുൻഗണനകൾ നിയന്ത്രിക്കുക', save: 'എന്റെ തിരഞ്ഞെടുപ്പുകൾ സംരക്ഷിക്കുക', required: 'ആവശ്യമാണ്', withdraw: 'നിങ്ങൾക്ക് എപ്പോൾ വേണമെങ്കിലും സമ്മതം പിൻവലിക്കാം.' },
    pa: { title: 'ਅਸੀਂ ਤੁਹਾਡੀ ਨਿੱਜਤਾ ਦੀ ਕਦਰ ਕਰਦੇ ਹਾਂ', desc: 'ਅਸੀਂ ਡਿਜੀਟਲ ਨਿੱਜੀ ਡਾਟਾ ਸੁਰੱਖਿਆ ਐਕਟ 2023 ਅਨੁਸਾਰ ਕੁਕੀਜ਼ ਅਤੇ ਤੁਹਾਡਾ ਨਿੱਜੀ ਡਾਟਾ ਵਰਤਦੇ ਹਾਂ।', accept: 'ਸਭ ਸਵੀਕਾਰ ਕਰੋ', reject: 'ਸਭ ਰੱਦ ਕਰੋ', manage: 'ਤਰਜੀਹਾਂ ਪ੍ਰਬੰਧਿਤ ਕਰੋ', save: 'ਮੇਰੀਆਂ ਚੋਣਾਂ ਸੰਭਾਲੋ', required: 'ਲੋੜੀਂਦਾ', withdraw: 'ਤੁਸੀਂ ਕਿਸੇ ਵੀ ਸਮੇਂ ਸਹਿਮਤੀ ਵਾਪਸ ਲੈ ਸਕਦੇ ਹੋ।' },
    or: { title: 'ଆମେ ଆପଣଙ୍କ ଗୋପନୀୟତାକୁ ମୂଲ୍ୟ ଦେଉ', desc: 'ଆମେ ଡିଜିଟାଲ୍ ବ୍ୟକ୍ତିଗତ ତଥ୍ୟ ସୁରକ୍ଷା ଆଇନ 2023 ଅନୁଯାୟୀ କୁକିଜ୍ ଏବଂ ଆପଣଙ୍କ ବ୍ୟକ୍ତିଗତ ତଥ୍ୟ ବ୍ୟବହାର କରୁ।', accept: 'ସବୁ ଗ୍ରହଣ କରନ୍ତୁ', reject: 'ସବୁ ପ୍ରତ୍ୟାଖ୍ୟାନ କରନ୍ତୁ', manage: 'ପସନ୍ଦ ପରିଚାଳନା କରନ୍ତୁ', save: 'ମୋର ପସନ୍ଦ ସଞ୍ଚୟ କରନ୍ତୁ', required: 'ଆବଶ୍ୟକ', withdraw: 'ଆପଣ ଯେକୌଣସି ସମୟରେ ସମ୍ମତି ପ୍ରତ୍ୟାହାର କରିପାରିବେ।' },
    as: { title: 'আমি আপোনাৰ গোপনীয়তাক মূল্য দিওঁ', desc: 'আমি ডিজিটেল ব্যক্তিগত তথ্য সুৰক্ষা আইন 2023 অনুসৰি কুকি আৰু আপোনাৰ ব্যক্তিগত তথ্য ব্যৱহাৰ কৰোঁ।', accept: 'সকলো গ্ৰহণ কৰক', reject: 'সকলো প্ৰত্যাখ্যান কৰক', manage: 'পছন্দ পৰিচালনা কৰক', save: 'মোৰ পছন্দ সংৰক্ষণ কৰক', required: 'আৱশ্যক', withdraw: 'আপুনি যিকোনো সময়তে সন্মতি প্ৰত্যাহাৰ কৰিব পাৰে।' },
    ur: { title: 'ہم آپ کی رازداری کا احترام کرتے ہیں', desc: 'ہم ڈیجیٹل ذاتی ڈیٹا تحفظ ایکٹ 2023 کے مطابق کوکیز اور آپ کا ذاتی ڈیٹا استعمال کرتے ہیں۔', accept: 'سب قبول کریں', reject: 'سب مسترد کریں', manage: 'ترجیحات کا نظم کریں', save: 'میری پسند محفوظ کریں', required: 'ضروری', withdraw: 'آپ کسی بھی وقت رضامندی واپس لے سکتے ہیں۔' },
    sa: { title: 'वयं भवतः गोपनीयतां सम्मानयामः', desc: 'वयं डिजिटल्-व्यक्तिगत-दत्तांश-संरक्षण-अधिनियम 2023 इत्यस्य अनुसारं कुकीज् भवतः व्यक्तिगतदत्तांशं च उपयुञ्ज्महे।', accept: 'सर्वं स्वीकुरुत', reject: 'सर्वं निराकुरुत', manage: 'अभिरुचयः प्रबन्धयत', save: 'मम चयनानि रक्षत', required: 'आवश्यकम्', withdraw: 'भवान् कस्मिन् अपि समये सम्मतिं प्रत्याहर्तुं शक्नोति।' },
    ne: { title: 'हामी तपाईंको गोपनीयतालाई महत्त्व दिन्छौं', desc: 'हामी डिजिटल व्यक्तिगत डेटा संरक्षण ऐन 2023 अनुसार कुकिज र तपाईंको व्यक्तिगत डेटा प्रयोग गर्छौं।', accept: 'सबै स्वीकार गर्नुहोस्', reject: 'सबै अस्वीकार गर्नुहोस्', manage: 'प्राथमिकताहरू व्यवस्थापन गर्नुहोस्', save: 'मेरा छनोटहरू सुरक्षित गर्नुहोस्', required: 'आवश्यक', withdraw: 'तपाईं जुनसुकै समयमा सहमति फिर्ता लिन सक्नुहुन्छ।' },
    ko: { title: 'आमी तुमच्या गुपीतपणाक मान दितांव', desc: 'आमी डिजिटल वैयक्तिक डेटा संरक्षण कायदो 2023 प्रमाणें कुकीज आनी तुमचो वैयक्तिक डेटा वापरतांव.', accept: 'सगळें स्वीकारात', reject: 'सगळें न्हयकारात', manage: 'प्राधान्यां व्यवस्थापित करात', save: 'म्हजी निवड जतनाय करात', required: 'गरजेचें', withdraw: 'तुमी खंयच्याय वेळार संमती परतून घेवंक शकतात.' },
    mai: { title: 'हम अहाँक गोपनीयताक सम्मान करैत छी', desc: 'हम डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम 2023 क अनुसार कुकीज आ अहाँक व्यक्तिगत डेटा प्रयोग करैत छी।', accept: 'सभ स्वीकार करू', reject: 'सभ अस्वीकार करू', manage: 'प्राथमिकता प्रबंधित करू', save: 'हमर पसंद सहेजू', required: 'आवश्यक', withdraw: 'अहाँ कोनो समय सहमति वापस लऽ सकैत छी।' },
    doi: { title: 'अस तुंदी निजता दा सम्मान करने आं', desc: 'अस डिजिटल निजी डेटा सुरक्षा कानून 2023 दे मताबक कुकीज ते तुंदा निजी डेटा वरतने आं।', accept: 'सब्भ स्वीकार करो', reject: 'सब्भ रद्द करो', manage: 'तरजीहां दा प्रबंधन करो', save: 'मेरियां चोनां सैंभलो', required: 'लोड़चदा', withdraw: 'तुस कुसै बी समें सहमति वापस लै सकदे ओ।' },
    sd: { title: 'اسان توهان جي رازداري جو احترام ڪريون ٿا', desc: 'اسان ڊجيٽل ذاتي ڊيٽا تحفظ ايڪٽ 2023 مطابق ڪوڪيز ۽ توهان جو ذاتي ڊيٽا استعمال ڪريون ٿا.', accept: 'سڀ قبول ڪريو', reject: 'سڀ رد ڪريو', manage: 'ترجيحون منظم ڪريو', save: 'منهنجون چونڊون محفوظ ڪريو', required: 'ضروري', withdraw: 'توهان ڪنهن به وقت رضامندي واپس وٺي سگهو ٿا.' },
  };

  function detectLang(supported) {
    // Explicit data-lang wins as long as we ship a translation for it — the site
    // owner asked for this language deliberately, so don't second-guess it.
    if (LANG_PREF !== 'auto') return T[LANG_PREF] ? LANG_PREF : 'en';
    // Auto-detect: follow the browser language, but only when the org lists it as
    // supported AND we actually have a translation. Otherwise fall back to English.
    var nav = ((navigator.language || navigator.userLanguage || 'en').split('-')[0]).toLowerCase();
    return (T[nav] && supported.indexOf(nav) !== -1) ? nav : 'en';
  }

  function getUID() {
    var id = lsGet(UID_KEY);
    if (!id) { id = 'web-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9); lsSet(UID_KEY, id); }
    return id;
  }

  function record(accepted, rejected, lang) {
    fetch(API + '/api/consent/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_slug: ORG, data_principal_identifier: getUID(), purposes_accepted: accepted, purposes_rejected: rejected, language: lang, channel: 'web', user_agent: navigator.userAgent }),
    }).catch(function () {});
    lsSet(STORAGE_KEY, JSON.stringify({ accepted: accepted, rejected: rejected, lang: lang, ts: Date.now() }));
  }

  function injectCSS(color) {
    var c = color.startsWith('#') ? color : '#' + color;
    var css = '.ts-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:2147483646;display:flex;align-items:center;justify-content:center}'
      + '.ts-banner{background:#fff;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.2);padding:24px;max-width:480px;width:calc(100vw - 32px);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-sizing:border-box}'
      + '.ts-bar{position:fixed;bottom:0;left:0;right:0;z-index:2147483646;background:#fff;border-top:1px solid #e5e7eb;padding:16px 24px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}'
      + '.ts-corner{position:fixed;bottom:16px;right:16px;z-index:2147483646;background:#fff;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.15);padding:20px;max-width:340px;width:calc(100vw - 32px);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-sizing:border-box}'
      + '.ts-title{font-size:15px;font-weight:600;color:#1a1a2e;margin:0 0 6px}'
      + '.ts-desc{font-size:13px;color:#6b7280;line-height:1.5;margin:0 0 14px}'
      + '.ts-btns{display:flex;flex-wrap:wrap;gap:8px;align-items:center}'
      + '.ts-btn-primary{background:' + c + ';color:#fff;border:2px solid ' + c + ';border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;line-height:1}'
      + '.ts-btn-secondary{background:#fff;color:' + c + ';border:2px solid ' + c + ';border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;line-height:1}'
      + '.ts-btn-ghost{background:#fff;color:#6b7280;border:1px solid #e5e7eb;border-radius:8px;padding:8px 16px;font-size:13px;cursor:pointer;line-height:1}'
      + '.ts-purposes{margin:0 0 14px;padding:0;list-style:none}'
      + '.ts-purpose{display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid #f3f4f6}'
      + '.ts-purpose:last-child{border-bottom:none}'
      + '.ts-chk{width:16px;height:16px;border-radius:4px;border:1.5px solid #d1d5db;cursor:pointer;flex-shrink:0;margin-top:2px;appearance:none;-webkit-appearance:none}'
      + '.ts-chk:checked{background:' + c + ';border-color:' + c + '}'
      + '.ts-chk:disabled{background:' + c + ';border-color:' + c + ';cursor:not-allowed;opacity:0.8}'
      + '.ts-pname{font-size:13px;font-weight:500;color:#1a1a2e}'
      + '.ts-pdesc{font-size:12px;color:#9ca3af;margin-top:2px}'
      + '.ts-req{font-size:10px;color:' + c + ';background:' + c + '18;padding:1px 6px;border-radius:4px;margin-left:6px;vertical-align:middle}'
      + '.ts-withdraw{font-size:11px;color:#9ca3af;margin-top:10px}'
      + '.ts-powered{font-size:10px;color:#d1d5db;text-align:right;margin-top:8px}'
      + '.ts-powered a{color:#d1d5db;text-decoration:none}'
      + '.ts-hidden{display:none}';
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  function buildPurposeList(purposes, t, checks) {
    var lang = t._lang || 'en';
    var nameField = (lang === 'hi' && 'name_hi') || (lang === 'ta' && 'name_ta') || (lang === 'te' && 'name_te') || 'name_en';
    var html = '<ul class="ts-purposes">';
    for (var i = 0; i < purposes.length; i++) {
      var p = purposes[i];
      var chkId = 'ts-p-' + p.purpose_key;
      var displayName = (p[nameField] && p[nameField].trim()) ? p[nameField] : p.name_en;
      html += '<li class="ts-purpose">'
        + '<input type="checkbox" class="ts-chk" id="' + chkId + '" data-key="' + p.purpose_key + '"'
        + (p.required ? ' checked disabled' : (checks[p.purpose_key] !== false ? ' checked' : '')) + '>'
        + '<label for="' + chkId + '">'
        + '<span class="ts-pname">' + esc(displayName) + (p.required ? '<span class="ts-req">' + t.required + '</span>' : '') + '</span>'
        + '<div class="ts-pdesc">' + esc(p.description_en) + '</div>'
        + '</label>'
        + '</li>';
    }
    html += '</ul>';
    return html;
  }

  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function getChecked(purposes) {
    var acc = [], rej = [];
    for (var i = 0; i < purposes.length; i++) {
      var k = purposes[i].purpose_key;
      var el = document.getElementById('ts-p-' + k);
      if (purposes[i].required || (el && el.checked)) acc.push(k);
      else rej.push(k);
    }
    return { accepted: acc, rejected: rej };
  }

  function showManage(el, purposes, t) {
    var div = document.getElementById('ts-manage-section');
    if (!div) return;
    if (div.classList.contains('ts-hidden')) {
      div.classList.remove('ts-hidden');
      el.textContent = t.save;
      el.removeAttribute('data-action');
      el.setAttribute('data-action', 'save');
    } else {
      var r = getChecked(purposes);
      record(r.accepted, r.rejected, t._lang);
      destroy();
      renderFloatingButton();
    }
  }

  function destroy() {
    var el = document.getElementById('ts-root');
    if (el) el.remove();
  }

  // ── Withdraw / preference-center additions ──────────────────────────────────
  var _config = null, _lang = null;

  // Short labels for the withdraw action + confirmation toast. Falls back to
  // English for languages we don't have a phrase for yet.
  var WD = {
    en: 'Withdraw consent', hi: 'सहमति वापस लें', bn: 'সম্মতি প্রত্যাহার করুন', ta: 'ஒப்புதலை திரும்பப் பெறு',
    te: 'సమ్మతిని ఉపసంహరించు', mr: 'संमती मागे घ्या', gu: 'સંમતિ પાછી ખેંચો', kn: 'ಸಮ್ಮತಿ ಹಿಂಪಡೆಯಿರಿ',
    ml: 'സമ്മതം പിൻവലിക്കുക', pa: 'ਸਹਿਮਤੀ ਵਾਪਸ ਲਓ', or: 'ସମ୍ମତି ପ୍ରତ୍ୟାହାର କରନ୍ତୁ', as: 'সন্মতি প্ৰত্যাহাৰ কৰক',
    ur: 'رضامندی واپس لیں', sa: 'सम्मतिं प्रत्याहरतु', ne: 'सहमति फिर्ता लिनुहोस्'
  };
  var CONF = {
    en: 'Your consent has been withdrawn.', hi: 'आपकी सहमति वापस ले ली गई है।', bn: 'আপনার সম্মতি প্রত্যাহার করা হয়েছে।',
    ta: 'உங்கள் ஒப்புதல் திரும்பப் பெறப்பட்டது.', te: 'మీ సమ్మతి ఉపసంహరించబడింది.', mr: 'तुमची संमती मागे घेण्यात आली आहे.',
    gu: 'તમારી સંમતિ પાછી ખેંચી લેવામાં આવી છે.', kn: 'ನಿಮ್ಮ ಸಮ್ಮತಿಯನ್ನು ಹಿಂಪಡೆಯಲಾಗಿದೆ.', ml: 'നിങ്ങളുടെ സമ്മതം പിൻവലിച്ചു.',
    pa: 'ਤੁਹਾਡੀ ਸਹਿਮਤੀ ਵਾਪਸ ਲੈ ਲਈ ਗਈ ਹੈ।', or: 'ଆପଣଙ୍କ ସମ୍ମତି ପ୍ରତ୍ୟାହାର କରାଯାଇଛି।', as: 'আপোনাৰ সন্মতি প্ৰত্যাহাৰ কৰা হৈছে।',
    ur: 'آپ کی رضامندی واپس لے لی گئی ہے۔', sa: 'भवतः सम्मतिः प्रत्याहृता।', ne: 'तपाईंको सहमति फिर्ता लिइएको छ।'
  };

  function injectBaseCSS() {
    if (document.getElementById('ts-base-css')) return;
    var css = '.ts-fab{position:fixed;bottom:16px;left:16px;z-index:2147483645;width:44px;height:44px;border-radius:50%;background:#1a1a2e;border:none;box-shadow:0 4px 16px rgba(0,0,0,0.25);cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;transition:transform .15s}'
      + '.ts-fab:hover{transform:scale(1.08)}'
      + '.ts-fab svg{width:22px;height:22px}'
      + '.ts-btn-withdraw{background:#fff;color:#b91c1c;border:1px solid #fecaca;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:500;cursor:pointer;line-height:1}'
      + '.ts-toast{position:fixed;bottom:16px;left:16px;z-index:2147483647;background:#1a1a2e;color:#fff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:13px;padding:10px 16px;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.25);max-width:300px}';
    var style = document.createElement('style');
    style.id = 'ts-base-css';
    style.textContent = css;
    document.head.appendChild(style);
  }

  // Fetch config once and cache it (used for both first render and re-opens).
  function loadConfig(cb) {
    if (_config) { cb(_config); return; }
    fetch(API + '/api/consent/config?org=' + encodeURIComponent(ORG))
      .then(function (r) { return r.json(); })
      .then(function (config) {
        if (!config.purposes || !config.purposes.length) return;
        _config = config;
        _lang = detectLang(config.languages || ['en']);
        cb(config);
      })
      .catch(function () {});
  }

  function renderFloatingButton() {
    injectBaseCSS();
    if (document.getElementById('ts-fab')) return;
    var btn = document.createElement('button');
    btn.id = 'ts-fab';
    btn.className = 'ts-fab';
    btn.setAttribute('aria-label', 'Privacy choices');
    btn.setAttribute('title', 'Privacy choices');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>';
    btn.onclick = openManage;
    document.body.appendChild(btn);
  }

  function removeFab() {
    var f = document.getElementById('ts-fab');
    if (f) f.remove();
  }

  // Re-open the banner from the floating button, pre-filling the visitor's prior
  // choices and showing a withdraw option when there is an active consent.
  function openManage() {
    loadConfig(function (config) {
      var prev = {}, hasConsent = false, stored = lsGet(STORAGE_KEY);
      if (stored) {
        try {
          var s = JSON.parse(stored);
          hasConsent = true;
          (s.accepted || []).forEach(function (k) { prev[k] = true; });
          (s.rejected || []).forEach(function (k) { prev[k] = false; });
        } catch (e) {}
      }
      removeFab();
      render(config, config.purposes, _lang, { manage: true, prevChoices: prev, showWithdraw: hasConsent });
    });
  }

  function withdrawConsent(lang) {
    fetch(API + '/api/consent/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_slug: ORG, data_principal_identifier: getUID() }),
    }).catch(function () {});
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    destroy();
    showConfirmation(lang);
    renderFloatingButton();
  }

  function showConfirmation(lang) {
    injectBaseCSS();
    var ex = document.getElementById('ts-toast');
    if (ex) ex.remove();
    var d = document.createElement('div');
    d.id = 'ts-toast';
    d.textContent = CONF[lang] || CONF.en;
    document.body.appendChild(d);
    setTimeout(function () { if (d && d.parentNode) d.parentNode.removeChild(d); }, 4000);
  }

  function render(config, purposes, lang, opts) {
    opts = opts || {};
    var t = T[lang] || T.en;
    t._lang = lang;
    var c = (config.primary_color || '003366');
    injectCSS(c);
    var color = c.startsWith('#') ? c : '#' + c;

    var isModal = config.position === 'center-modal';
    var isCorner = config.position === 'corner-popup';

    // Right-to-left scripts: let the browser flip alignment/flow for the banner.
    var RTL_LANGS = ['ur', 'ks', 'sd', 'ar', 'fa'];
    var dirAttr = RTL_LANGS.indexOf(lang) !== -1 ? ' dir="rtl"' : '';

    var root = document.createElement('div');
    root.id = 'ts-root';
    if (isModal) root.className = 'ts-overlay';

    var bannerClass = isModal ? 'ts-banner' : isCorner ? 'ts-corner' : 'ts-bar';

    var manageSec = buildPurposeList(purposes, t, opts.prevChoices || {});
    var wdLabel = WD[lang] || WD.en;

    root.innerHTML = '<div class="' + bannerClass + '"' + dirAttr + ' role="dialog" aria-modal="true" aria-label="' + esc(t.title) + '">'
      + '<p class="ts-title">' + esc(t.title) + '</p>'
      + '<p class="ts-desc">' + esc(t.desc) + '</p>'
      + '<div id="ts-manage-section" class="' + (opts.manage ? '' : 'ts-hidden') + '">' + manageSec + '</div>'
      + '<div class="ts-btns">'
      + '<button class="ts-btn-primary" id="ts-accept">' + esc(t.accept) + '</button>'
      + (config.show_reject_all ? '<button class="ts-btn-secondary" id="ts-reject">' + esc(t.reject) + '</button>' : '')
      + '<button class="ts-btn-ghost" id="ts-manage" data-action="' + (opts.manage ? 'save' : 'manage') + '">' + esc(opts.manage ? t.save : t.manage) + '</button>'
      + '</div>'
      + (opts.showWithdraw ? '<div style="margin-top:8px"><button class="ts-btn-withdraw" id="ts-withdraw">' + esc(wdLabel) + '</button></div>' : '')
      + '<p class="ts-withdraw">' + esc(t.withdraw) + '</p>'
      + '<p class="ts-powered">Powered by <a href="https://app.truststack.in" target="_blank" rel="noopener">TrustStack™</a></p>'
      + '</div>';

    document.body.appendChild(root);

    document.getElementById('ts-accept').onclick = function () {
      var acc = purposes.map(function (p) { return p.purpose_key; });
      record(acc, [], lang);
      destroy();
      renderFloatingButton();
    };

    var rejectBtn = document.getElementById('ts-reject');
    if (rejectBtn) {
      rejectBtn.onclick = function () {
        var acc = purposes.filter(function (p) { return p.required; }).map(function (p) { return p.purpose_key; });
        var rej = purposes.filter(function (p) { return !p.required; }).map(function (p) { return p.purpose_key; });
        record(acc, rej, lang);
        destroy();
        renderFloatingButton();
      };
    }

    document.getElementById('ts-manage').onclick = function () {
      showManage(this, purposes, t);
    };

    var wdBtn = document.getElementById('ts-withdraw');
    if (wdBtn) {
      wdBtn.onclick = function () { withdrawConsent(lang); };
    }

    if (isModal) {
      root.onclick = function (e) { if (e.target === root) {} };
    }
  }

  // Boot: returning visitors with an existing choice see a small floating button
  // to re-open preferences / withdraw; first-time visitors see the banner.
  if (lsGet(STORAGE_KEY)) {
    renderFloatingButton();
  } else {
    loadConfig(function (config) {
      render(config, config.purposes, _lang, {});
    });
  }
})();
