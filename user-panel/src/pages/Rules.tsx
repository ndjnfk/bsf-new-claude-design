import { useState } from 'react'
import { Modal, Button } from 'react-bootstrap'
import { useLocation, useNavigate } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useAuth } from '../store/auth'

type Lang = 'hi' | 'en'

// Rules content in both languages, toggled by the हिन्दी / English buttons.
const CONTENT: Record<Lang, { welcome: string; topNote: string; rules: string[]; bottomNote: string }> = {
  hi: {
    welcome: '🏏 !! PLAY2020 में आपका स्वागत है !! 🏏',
    topNote:
      'नोट :- PLAY2020 के सभी ID मैं रूले, इनसाइड आउटसाइड(अंदर-बाहर), और तीन पत्ती ये सभी लाइव गेम इन-प्ले हो गए हे| आपको गेम के आवश्यकता हो तो आप अपने एजेंट से संपर्क करे| PLAY2020',
    rules: [
      'कृपया PLAY2020 के नियमों को समझने के लिए यहां कुछ मिनट दें, और अपने अनुसार समझ लें |',
      'एक एक मिनट मे जो लगाइ खाई करते है उनके सौदे डिलीट कर दिए जायेंगे बाद में कोई वाद विवाद मान्य नहीँ होगा |',
      'लॉग इन करने के बाद अपना पासवर्ड बदल लें |',
      'प्रत्येक गेम के लिए 0 /- कॉइन्स चार्ज रहेगा |',
      'यदि आप मैच या सेशन का एक भी सौदा नहीं करते हो, ऐसे में आपसे 0/- कॉइन्स का चार्ज लिया जायेगा |',
      'सभी एडवांस सौदे टॉस के बाद लिए जाएंगे |',
      'खेल रद्द या टाई होने पर सभी सौदे रद्द कर दिए जाएंगे और लेनदेन सेशन और फैंसी जो पूरा हो गया है उस पर किया जाएगा |',
      'मैच का सौदा कम से कम 10 और अधिकतम 1000000 है और सेशन का सौदा कम से कम 10 और अधिकतम 50000 है|',
      'लाइव ड्रा टीवी स्कोर पर निर्भर है | दर कभी नहीं बदली जाती है | यह यूजर के लिए अच्छा मौका है |',
      'मैच के दौरान भाव को देख और समझ कर ही सौदा करें | किये गए किसी भी सौदे को हटाया या बदता नहीं जायेगा | सभी सौदे के लिए आप स्वयं जिम्मेवार हैं |',
      'यहाँ सभी सौदे लेजर से मान्य किये जायेंगे |',
      'कैसीनो में परिणाम फंसने की स्तिथि में लेनदेन रद्द कर दिया जाएगा।',
      'इनसाइड-आउट गेम में पहला कार्ड खोले जाने पर 25% का भुगतान किया जाएगा।',
      'गेम खेलने से पहले कैसीनो के नियम भी पढ़ें।',
      'कैसीनो में किसी प्रकार के तर्क स्वीकार नहीं किए जाएंगे।',
      'इंटरनेट कनेक्शन प्रॉब्लम की जिम्मेवारी आपकी रहेगी |',
    ],
    bottomNote:
      'नोट: सर्वर या वेबसाइट में किसी तरह की खराबी आने या बंद हो जाने पर केवल किए गए सौदे ही मान्य होंगे | ऐसी स्तिथि में किसी तरह का वाद-विवाद मान्य नहीं होगा |',
  },
  en: {
    welcome: '🏏 !! Welcome To PLAY2020 !! 🏏',
    topNote:
      'Note :- PLAY2020 Ke Sabhi ID Me Roulette, Inside Outside(Andar Bahar), & Teen Patti Yee sabhi Live Game inplay Ho gay hai aapko Game ke Requirement ho tho aap apne Agent se Contact kare. PLAY2020',
    rules: [
      'Please give a few minutes to understand rules of PLAY2020 here, as best as you can.',
      'Those who trade within a minute, their trades will be deleted and no further disputes will be accepted.',
      'Change your password after you log in.',
      'All the advance bets will be accepted after the toss.',
      'For every Match 0/- coins will be charged.',
      '0/- coins will be charged if user will not play any Market bet or Session bet in a match.',
      'If game is cancelled or tie then all the deals will be cancelled and the transactions will be done on session and fancy which are completed.',
      'The deal of the match is at least 10 and maximum 1000000 and the deal of session is at least 10 and maximun 50000.',
      'Live draw is settled on TV score, rate is never changed. This is good chance for users.',
      'During the match, please bet only after confirming the deal. Once the deal is confirmed, it cannot be changed or removed. Responsibility of every deal is yours.',
      'All transactions will be validated from ledger only.',
      'Transactions will be canceled in case the result is stuck in the casino.',
      'In an inside-out game 25% will be paid out when the first card is opened.',
      'Also read the casino rules before playing the game.',
      'Arguments of any kind will not be accepted in the casino.',
      "It'll be user's responsibility for internet connection problem.",
    ],
    bottomNote:
      'Note: If some kind of breakdown occurs in server or website, only successful bets will be accepted. In such situation, any kind of debate will be invalid.',
  },
}

// Rules page + welcome modal. The modal auto-opens when arriving here right after
// login (navigation state { showWelcomeModal: true } set by the login flow), the
// React equivalent of Angular reading the router navigation state. The हिन्दी /
// English buttons toggle the rule language in place.
export default function Rules() {
  useDocumentTitle('Rules')
  const location = useLocation()
  const navigate = useNavigate()
  const domain = useAuth((s) => s.domain)
  const welcomeFlag = (location.state as { showWelcomeModal?: boolean } | null)?.showWelcomeModal === true
  const [showWelcome, setShowWelcome] = useState(welcomeFlag)
  const [lang, setLang] = useState<Lang>('hi')

  const banner = (domain?.login_banner as string | undefined) || '/assets/image/welcome-bg.webp'
  const c = CONTENT[lang]
  const listClass = lang === 'hi' ? 'hindi-rules-list' : 'english-rules-list'
  const noteClass = lang === 'hi' ? 'hindi-note-text' : 'english-note-text'

  return (
    <div id="wrapper">
      <div className="content-page m-0">
        <div className="content">
          {/* Language toggle */}
          <div className="nav-pills lang-btn-container d-flex justify-content-end gap-1 pt-3 px-3">
            <button
              type="button"
              className={`nav-link${lang === 'hi' ? ' active' : ''}`}
              onClick={() => setLang('hi')}
            >
              हिन्दी
            </button>
            <button
              type="button"
              className={`nav-link${lang === 'en' ? ' active' : ''}`}
              onClick={() => setLang('en')}
            >
              English
            </button>
          </div>

          <div className="rules-main-container">
            {/* Top welcome / note box */}
            <div className={noteClass}>
              <p className="rules-welcome-title mb-2">{c.welcome}</p>
              <p className="mb-0">{c.topNote}</p>
            </div>

            {/* Numbered rules */}
            <ol className={listClass}>
              {c.rules.map((rule, i) => (
                <li key={i}>{rule}</li>
              ))}
            </ol>

            {/* Bottom note */}
            <div className={noteClass}>
              <p className="mb-0">{c.bottomNote}</p>
            </div>

            <div className="main_menu_btn py-4">
              <button type="button" className="purp_btn" onClick={() => navigate('/userhome')}>
                MAIN MENU
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal show={showWelcome} onHide={() => setShowWelcome(false)} centered>
        <Modal.Body className="p-0">
          <img src={banner} alt="Welcome" className="d-block w-100" />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowWelcome(false)}>
            Continue
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
