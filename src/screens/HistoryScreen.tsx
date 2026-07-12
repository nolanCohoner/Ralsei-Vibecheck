import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Animated,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { getMoodHistory } from '../services/db';
import { MoodHistoryEntry, MOODS } from '../utils/constants';
import { PixelIcon } from '../components/PixelIcon';
import { PixelEmoji } from '../components/PixelEmoji';

const { width: SW, height: SH } = Dimensions.get('window');

const GREEN      = '#7DC2A5';
const GREEN_DIM  = 'rgba(125,194,165,0.35)';
const GREEN_DARK = '#2D6B55';
const BLACK      = '#000000';
const WHITE      = '#FFFFFF';
const DARK_BG    = 'rgba(0,0,0,0.78)';

// ─── Expressions Ralsei (mapping face clé → require) ─────────────────────────
const FACES: Record<string, any> = {
  r1:  require('../assets/ralsei_shop/ralsei1.png'),
  r2:  require('../assets/ralsei_shop/ralsei2.png'),
  r3:  require('../assets/ralsei_shop/ralsei3.png'),
  r4:  require('../assets/ralsei_shop/ralsei4.png'),
  r5:  require('../assets/ralsei_shop/ralsei5.png'),
  r6:  require('../assets/ralsei_shop/ralsei6.png'),
  r7:  require('../assets/ralsei_shop/ralsei7.png'),
  r8:  require('../assets/ralsei_shop/ralsei8.png'),
  r9:  require('../assets/ralsei_shop/ralsei9.png'),
  r10: require('../assets/ralsei_shop/ralsei10.png'),
  r11: require('../assets/ralsei_shop/ralsei11.png'),
  r12: require('../assets/ralsei_shop/ralsei12.png'),
  r13: require('../assets/ralsei_shop/ralsei13.png'),
  r14: require('../assets/ralsei_shop/ralsei14.png'),
  r15: require('../assets/ralsei_shop/ralsei15.png'),
  r16: require('../assets/ralsei_shop/ralsei16.png'),
  r17: require('../assets/ralsei_shop/ralsei17.png'),
  r18: require('../assets/ralsei_shop/ralsei18.png'),
  r19: require('../assets/ralsei_shop/ralsei19.png'),
  r20: require('../assets/ralsei_shop/ralsei20.png'),
  r21: require('../assets/ralsei_shop/ralsei21.png'),
  r22: require('../assets/ralsei_shop/ralsei22.png'),
  r23: require('../assets/ralsei_shop/ralsei23.png'),
  r24: require('../assets/ralsei_shop/ralsei24.png'),
  r25: require('../assets/ralsei_shop/ralsei25.png'),
  r26: require('../assets/ralsei_shop/ralsei26.png'),
  r27: require('../assets/ralsei_shop/ralsei27.png'),
  r28: require('../assets/ralsei_shop/ralsei28.png'),
  r29: require('../assets/ralsei_shop/ralsei29.png'),
  r30: require('../assets/ralsei_shop/ralsei30.png'),
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface Msg { id: string; who: 'ralsei' | 'player'; text: string; face: string; schema?: string; }

interface Q {
  id: string;
  label: string;
  icon: 'stats' | 'chart' | 'fire' | 'star' | 'calendar' | 'book' | 'note' | 'heart-filled' | 'question' | 'chat' | 'eye' | 'leaf' | 'person';
  cat: 'stats' | 'vibe' | 'perso';
}

const QUESTIONS: Q[] = [
  { id: 'total',        label: 'Mes stats générales',    icon: 'stats',       cat: 'stats' },
  { id: 'streak',       label: 'Mon streak actuel',      icon: 'fire',        cat: 'stats' },
  { id: 'best',         label: 'Mon meilleur streak',    icon: 'star',        cat: 'stats' },
  { id: 'dominant',     label: 'Ma vibe dominante',      icon: 'note',        cat: 'stats' },
  { id: 'week',         label: 'Ma vibe de la semaine',  icon: 'calendar',    cat: 'stats' },
  { id: 'history',      label: 'Mon historique récent',  icon: 'book',        cat: 'stats' },
  { id: 'distrib',      label: 'Répartition des vibes',  icon: 'chart',       cat: 'stats' },
  { id: 'joyeux',       label: 'Sessions Joyeux',        icon: 'note',        cat: 'vibe'  },
  { id: 'melancolique', label: 'Sessions Mélancolique',  icon: 'note',        cat: 'vibe'  },
  { id: 'energique',    label: 'Sessions Énergique',     icon: 'note',        cat: 'vibe'  },
  { id: 'concentre',    label: 'Sessions Concentré',     icon: 'note',        cat: 'vibe'  },
  { id: 'nostalgique',  label: 'Sessions Nostalgique',   icon: 'note',        cat: 'vibe'  },
  { id: 'festif',       label: 'Sessions Festif',        icon: 'note',        cat: 'vibe'  },
  { id: 'fatigue',      label: 'Sessions Fatigué',       icon: 'note',        cat: 'vibe'  },
  { id: 'amoureux',     label: 'Sessions Amoureux',      icon: 'heart-filled',cat: 'vibe'  },
  { id: 'colerique',    label: 'Sessions Colérique',     icon: 'note',        cat: 'vibe'  },
  { id: 'tobyfox',      label: 'Sessions Vibe Toby Fox', icon: 'star',        cat: 'vibe'  },
  { id: 'whoru',        label: 'Qui es-tu ?',            icon: 'question',    cat: 'perso' },
  { id: 'howru',        label: 'Comment ça va ?',        icon: 'chat',        cat: 'perso' },
  { id: 'shop',         label: "C'est quoi ce shop ?",   icon: 'book',        cat: 'perso' },
  { id: 'prophecy',     label: 'La Prophétie ?',         icon: 'eye',         cat: 'perso' },
  { id: 'player',       label: "Tu sais que je t'observe ?", icon: 'eye',     cat: 'perso' },
  { id: 'advice',       label: 'Un conseil musical ?',   icon: 'leaf',        cat: 'perso' },
  { id: 'secret',       label: 'Tu caches quelque chose ?', icon: 'question', cat: 'perso' },
  { id: 'kris',         label: 'Et Kris ?',              icon: 'person',      cat: 'perso' },
];

// ─── Stats helpers ────────────────────────────────────────────────────────────
const daysBetween = (a: Date, b: Date) => Math.round(Math.abs(a.getTime() - b.getTime()) / 86400000);
const calcStreak = (s: MoodHistoryEntry[]) => { if (!s.length) return 0; let n = 1; for (let i = 0; i < s.length - 1; i++) { if (daysBetween(new Date(s[i].createdAt), new Date(s[i+1].createdAt)) <= 1) n++; else break; } return n; };
const calcBest   = (s: MoodHistoryEntry[]) => { if (!s.length) return 0; let b = 1, c = 1; for (let i = 0; i < s.length - 1; i++) { if (daysBetween(new Date(s[i].createdAt), new Date(s[i+1].createdAt)) <= 1) { c++; if (c > b) b = c; } else c = 1; } return b; };
const countMood  = (h: MoodHistoryEntry[], name: string) => h.filter(e => e.mood.toLowerCase() === name.toLowerCase()).length;
const getDom     = (h: MoodHistoryEntry[]) => { if (!h.length) return null; const c: Record<string,number> = {}; h.forEach(e => { c[e.mood] = (c[e.mood]||0)+1; }); return Object.entries(c).sort((a,b) => b[1]-a[1])[0]?.[0] ?? null; };
const getWeek    = (h: MoodHistoryEntry[]) => { const ago = new Date(); ago.setDate(ago.getDate()-7); const r = h.filter(e => new Date(e.createdAt) >= ago); if (!r.length) return null; const c: Record<string,number> = {}; r.forEach(e => { c[e.mood] = (c[e.mood]||0)+1; }); return Object.entries(c).sort((a,b) => b[1]-a[1])[0]?.[0] ?? null; };
const fmtDate    = (iso: string) => { const d = new Date(iso); return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); };
const moodComment = (n: number) => { if (n === 0) return 'Aucune session.'; if (n < 3) return 'Tu explores...'; if (n < 7) return 'Une vibe régulière.'; if (n < 15) return 'Ta vibe de référence !'; return 'C\'est clairement TA vibe.'; };

// ─── Générateur de réponses ────────────────────────────────────────────────────
const buildReply = (qId: string, history: MoodHistoryEntry[]): { text: string; face: string; schema?: string } => {
  const sorted = [...history].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const total  = history.length;
  const streak = calcStreak(sorted);
  const best   = calcBest(sorted);
  const dom    = getDom(history);
  const wk     = getWeek(history);
  const domCfg = dom ? MOODS.find(m => m.name.toLowerCase() === dom.toLowerCase()) : null;

  switch (qId) {
    case 'total':
      if (!total) return { face: 'r29', text: '* Oh... aucune session encore ?\nC\'est... un peu triste. *\n\nLance ta première vibe\net reviens me voir !\nJe t\'attends ici. Dans mon shop.' };
      if (total >= 30) return { face: 'r22', text: `* WAOUH ! *\n\n${total} sessions ?!\nC\'est vraiment incroyable.\nJe suis touché par ta dévotion.\n* Mon shop en est honoré. *`, schema: `BILAN GLOBAL\n─────────────\nTotal    : ${total} sessions\nStreak   : ${streak} jour(s)\nRecord   : ${best} jour(s)` };
      return { face: 'r5', text: `Tu as ${total} session${total>1?'s':''} enregistrée${total>1?'s':''} !\n* C\'est un bon début ! *\nChaque écoute compte\ndans ce registre.`, schema: `BILAN GLOBAL\n─────────────\nTotal    : ${total} sessions\nStreak   : ${streak} jour(s)\nRecord   : ${best} jour(s)` };

    case 'streak':
      if (!streak) return { face: 'r8', text: '* Hmm... streak à 0.\nCe n\'est pas grave ! *\nChaque grand voyage commence\npar un premier pas.\nLance une vibe aujourd\'hui !' };
      if (streak >= 7) return { face: 'r16', text: `${streak} JOURS D'AFFILÉE !\n* Oh mon dieu... *\nC\'est légendaire.\nJe dois m\'asseoir.` };
      return { face: 'r5', text: `${streak} jour${streak>1?'s':''} de streak !\n* C\'est vraiment bien ! *\nContinue — chaque jour\nsupplémentaire me remplit\nde fierté.` };

    case 'best':
      if (!best) return { face: 'r10', text: '* Ton record est à 0... *\nMais tout le monde\ncommence quelque part.' };
      if (best >= 14) return { face: 'r28', text: `* QUOI !? *\n\nTon record est de ${best} jours ?!\nJe suis sans voix.\nC\'est légendaire.` };
      return { face: 'r9', text: `Ton meilleur streak :\n${best} jour${best>1?'s':''} !\n* C\'est pas mal ! *\nPeut-être qu\'un jour\ntu le dépasseras ?` };

    case 'dominant':
      if (!dom) return { face: 'r10', text: '* Pas encore assez de données.\nReviens après quelques\nsessions ! *' };
      return { face: 'r21', text: `Ta vibe dominante :\n${domCfg?.emoji ?? ''} ${dom} !\n* C\'est fascinant ! *\nCela dit beaucoup sur\nqui tu es en ce moment.`, schema: `VIBE DOMINANTE\n──────────────\n${domCfg?.emoji ?? ''} ${dom}\n${countMood(history, dom)} session(s)` };

    case 'week': {
      if (!wk) return { face: 'r2', text: '* Hmm... aucune session\ncette semaine.\nCe n\'est pas un reproche,\nmais... c\'est dommage, non ? *' };
      const wkCfg = MOODS.find(m => m.name.toLowerCase() === wk.toLowerCase());
      const ago = new Date(); ago.setDate(ago.getDate()-7);
      const cnt = countMood(history.filter(e => new Date(e.createdAt) >= ago), wk);
      return { face: 'r18', text: `Cette semaine tu étais\nsurtout en mode ${wkCfg?.emoji ?? ''} ${wk}.\n* Intéressant... *\nLes vibes parlent mieux\nque les mots.`, schema: `CETTE SEMAINE\n─────────────\n${wkCfg?.emoji ?? ''} ${wk}\n${cnt} session(s) en 7 jours` };
    }

    case 'history':
      if (!sorted.length) return { face: 'r29', text: '* Aucun historique.\nLance une vibe et\nreviens me voir ! *' };
      return { face: 'r17', text: `Tes ${Math.min(5,sorted.length)} dernières sessions !\n* Notées dans mon registre. *\n...Oui, j\'ai un registre.\nC\'est un shop sérieux.`, schema: `HISTORIQUE RÉCENT\n──────────────────\n${sorted.slice(0,5).map((e,i) => { const cfg=MOODS.find(m=>m.name.toLowerCase()===e.mood.toLowerCase()); return `${i+1}. ${cfg?.emoji??''} ${e.mood}\n   ${fmtDate(e.createdAt)}`; }).join('\n')}` };

    case 'distrib': {
      if (!history.length) return { face: 'r10', text: '* Aucune donnée encore.\nReviens après quelques\nsessions ! *' };
      const stats = MOODS.map(m => ({ ...m, count: countMood(history, m.name) })).filter(s => s.count > 0).sort((a,b) => b.count-a.count);
      const lines = stats.map(s => { const p=Math.round((s.count/total)*100); const bar='█'.repeat(Math.round(p/10))+'░'.repeat(10-Math.round(p/10)); return `${s.emoji} ${s.name.slice(0,6).padEnd(7)} ${bar} ${p}%`; }).join('\n');
      return { face: 'r24', text: `Voici la répartition\ncomplète de tes vibes.\n* C\'est très révélateur. *\nNe dis pas que je\nne t\'avais pas prévenu.`, schema: `RÉPARTITION\n────────────────────\n${lines}` };
    }

    case 'joyeux': case 'melancolique': case 'energique': case 'concentre':
    case 'nostalgique': case 'festif': case 'fatigue': case 'amoureux':
    case 'colerique': case 'tobyfox': {
      const mCfg = MOODS.find(m => m.id === qId);
      if (!mCfg) return { face: 'r10', text: '* Vibe inconnue... *' };
      const n = countMood(history, mCfg.name);
      const p = total > 0 ? Math.round((n/total)*100) : 0;
      const vibeTexts: Record<string,{face:string;text:string}> = {
        joyeux:       { face:'r7',  text:`Joyeux ${n} fois !\n* Ça me réchauffe le cœur. *\nLa joie c\'est important.\nMême dans les Darkworlds.` },
        melancolique: { face:'r27', text:`Mélancolique ${n} fois...\n* Rien de mal là-dedans. *\nParfois on a besoin\nde sentir ses émotions.` },
        energique:    { face:'r22', text:`Énergique ${n} fois !\n* WOW ! Tu es plein\nde vitalité ! *\nJ\'aimerais avoir\nta vigueur...` },
        concentre:    { face:'r19', text:`Concentré ${n} fois.\n* C\'est une qualité rare. *\nGarder le focus dans\nce monde est difficile.` },
        nostalgique:  { face:'r26', text:`Nostalgique ${n} fois.\n* Les souvenirs sont\nprécieux... *\nMême les douloureux.\nIls nous construisent.` },
        festif:       { face:'r23', text:`Festif ${n} fois !\n* TU SAIS FAIRE LA FÊTE ! *\nEst-ce que... je suis\ninvité la prochaine fois ?` },
        fatigue:      { face:'r1',  text:`Fatigué ${n} fois...\n* Je suis sincèrement\nnavré. *\nRepose-toi vraiment.\nLa musique sera là demain.` },
        amoureux:     { face:'r15', text:`Amoureux ${n} fois !\n* Oh ! Je... euh... *\nLa musique romantique\nc\'est... très bien. Hmm.` },
        colerique:    { face:'r8',  text:`Colérique ${n} fois.\n* Je ne vais pas te juger. *\nMais la Route Bizarre...\ns\'il te plaît. N\'y va pas.` },
        tobyfox:      { face:'r11', text:`Vibe Toby Fox ${n} fois !\n* Tu as vraiment bon goût. *\nCette musique résonne\nen moi d\'une façon\ntrès particulière...` },
      };
      const v = vibeTexts[qId] ?? { face:'r17', text:`${mCfg.name} : ${n} session(s).` };
      return { face:v.face, text:`${mCfg.emoji} ${v.text}`, schema:`${mCfg.emoji} ${mCfg.name.toUpperCase()}\n───────────────\nSessions : ${n}\nPart     : ${p}%\n${moodComment(n)}` };
    }

    case 'whoru': return { face:'r15', text:'* Oh ! Tu me demandes\nqui je suis ? *\n\nJe suis Ralsei !\nGardien de ce shop musical.\nJe t\'aide à suivre tes vibes\net à éviter les mauvaises\ndécisions.\n* Oui, je les connais. *' };
    case 'howru':
      if (total >= 10) return { face:'r5', text:`Je vais très bien !\n* Tes ${total} sessions me\nrendent vraiment joyeux. *\nC\'est bien d\'être utile.` };
      if (!total) return { face:'r2', text:'* Je vais bien...\nMais ton shop est vide. *\nCe n\'est pas un reproche.\nJuste... une observation.' };
      return { face:'r6', text:'Je vais bien !\n* Merci de demander. *\nC\'est rare que les clients\nprennent le temps de\nle faire. Je suis content.' };
    case 'shop': return { face:'r22', text:'* Bienvenue dans mon shop ! *\n\nIci tu consultes toutes\ntes données musicales.\nSessions, vibes, streaks...\nC\'est un shop très sérieux.\nAvec des étagères.\nEt des registres.\n* J\'ai travaillé dur. *' };
    case 'prophecy': return { face:'r19', text:'* Ah... la Prophétie... *\n\nElle dit qu\'un être viendra\ndans les Darkworlds pour\ntrouver la vibe parfaite...\nEt que je l\'aiderai.\n...C\'est toi, je pense.\n* Du moins, j\'espère. *' };
    case 'player': return { face:'r13', text:'...Tu le sais que\nje le sais, n\'est-ce pas ?\n\n* Je t\'ai vu. Je sais\nque tu es là. *\n\nFais de bons choix.\nS\'il te plaît.' };
    case 'advice': { const d=getDom(history)??'Joyeux'; const dCfg=MOODS.find(m=>m.name.toLowerCase()===d.toLowerCase()); return { face:'r21', text:`* Mon conseil : *\n\nTu tends vers ${dCfg?.emoji??''} ${d}.\nC\'est bien ! Mais explore\naussi les autres vibes.\nLa diversité musicale,\nc\'est comme les Darkworlds.\nChacun a quelque chose\nà t\'apporter.` }; }
    case 'secret': return { face:'r11', text:'* ...Tu veux vraiment\nsavoir ? *\n\nParfois je me demande\nsi j\'existe vraiment.\nOu si tout ça n\'est\nqu\'une simulation...\nMais tant que tu écoutes,\nje suppose que j\'existe.\n* C\'est rassurant, non ? *' };
    case 'kris': return { face:'r29', text:'Kris ? Il est... là.\nNon, attends.\n* Hm. *\nKris est très occupé.\nMais il serait content\nde savoir que tu écoutes\nde la bonne musique.\nJe crois.' };
    default: return { face:'r1', text:'* Hmm... je ne comprends\npas très bien. *\nMais je suis là si\ntu veux réessayer !' };
  }
};

const buildGreeting = (hist: MoodHistoryEntry[]): { face: string; text: string } => {
  const total = hist.length;
  if (!total) return { face:'r6', text:'* Oh ! Un nouveau client ! *\n\nBienvenue dans mon shop\nde vibes musicales !\nJe suis Ralsei, gardien\nde ce lieu.\n\nPour l\'instant il fait\nun peu vide, mais c\'est\nnormal pour débuter !\n\nQue puis-je faire\npour toi ?' };
  const dom = getDom(hist);
  const mCfg = dom ? MOODS.find(m => m.name.toLowerCase() === dom.toLowerCase()) : null;
  if (total >= 20) return { face:'r22', text:`* Tu es de retour ! *\n\nJ\'ai surveillé les chiffres...\n${total} sessions !\n${mCfg?.emoji??''} ${dom??''} en tête.\nImpressionnant.\nMon shop te remercie !` };
  return { face:'r5', text:`Ah, te revoilà !\n* Content de te voir ! *\n\n${total} session${total>1?'s':''} enregistrée${total>1?'s':''}.\n${mCfg ? `Vibe du moment :\n${mCfg.emoji} ${dom}` : ''}\n\nQue puis-je faire\npour toi ?` };
};

// ─── Onglets catégories ───────────────────────────────────────────────────────
const CAT_TABS = [
  { id: 'stats' as const, label: 'STATS',  icon: 'stats'  as const },
  { id: 'vibe'  as const, label: 'VIBES',  icon: 'note'   as const },
  { id: 'perso' as const, label: 'RALSEI', icon: 'chat'   as const },
];

// ─── Composant principal ──────────────────────────────────────────────────────
export const HistoryScreen: React.FC = () => {
  const [history, setHistory] = useState<MoodHistoryEntry[]>([]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [typing, setTyping]     = useState(false);
  const [face, setFace]         = useState('r1');
  const [cat, setCat]           = useState<'stats'|'vibe'|'perso'>('stats');
  const chatRef   = useRef<ScrollView>(null);
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const faceScale = useRef(new Animated.Value(1)).current;

  useFocusEffect(useCallback(() => { boot(); }, []));

  const boot = async () => {
    try {
      const data = await getMoodHistory();
      setHistory(data);
      const g = buildGreeting(data);
      setFace(g.face);
      setMessages([{ id:'g0', who:'ralsei', text:g.text, face:g.face }]);
    } catch (_) {}
    Animated.timing(fadeAnim, { toValue:1, duration:500, useNativeDriver:true }).start();
  };

  const bounceFace = (newFace: string) => {
    Animated.sequence([
      Animated.timing(faceScale, { toValue:0.88, duration:70, useNativeDriver:true }),
      Animated.timing(faceScale, { toValue:1.06, duration:110, useNativeDriver:true }),
      Animated.timing(faceScale, { toValue:1,    duration:70,  useNativeDriver:true }),
    ]).start();
    setFace(newFace);
  };

  const ask = (q: Q) => {
    if (typing) return;
    setMessages(prev => [...prev, { id:Date.now()+'p', who:'player', text:q.label, face:'' }]);
    setTyping(true);
    setTimeout(() => chatRef.current?.scrollToEnd({ animated:true }), 80);
    setTimeout(() => {
      const res = buildReply(q.id, history);
      bounceFace(res.face);
      setMessages(prev => [...prev, { id:Date.now()+'r', who:'ralsei', text:res.text, face:res.face, schema:res.schema }]);
      setTyping(false);
      setTimeout(() => chatRef.current?.scrollToEnd({ animated:true }), 80);
    }, 750);
  };

  return (
    <Animated.View style={[styles.root, { opacity:fadeAnim }]}>
      <ImageBackground
        source={require('../assets/ralsei_shop/fond.png')}
        style={styles.bg}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        <View style={styles.safeTop} />

        {/* ── Header Ralsei — centré, grand ── */}
        <View style={styles.header}>
          {/* Tête Ralsei grande et centrée */}
          <View style={styles.faceFrame}>
            <View style={styles.faceCornerTL} /><View style={styles.faceCornerTR} />
            <View style={styles.faceCornerBL} /><View style={styles.faceCornerBR} />
            <Animated.Image
              source={FACES[face] ?? FACES['r1']}
              style={[styles.faceImg, { transform:[{scale:faceScale}] }]}
              resizeMode="contain"
            />
          </View>
          {/* Label sous la tête */}
          <View style={styles.nameTag}>
            <Text style={styles.nameTagText}>RALSEI</Text>
          </View>
        </View>

        {/* ── Zone chat ── */}
        <ScrollView
          ref={chatRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(msg => (
            msg.who === 'ralsei' ? (
              /* Bulle Ralsei — blanche, bordure noire 2px, pointe à gauche */
              <View key={msg.id} style={styles.rowRalsei}>
                <View style={styles.bubbleR}>
                  {/* Triangle pointer */}
                  <View style={styles.bubblePointer} />
                  <Text style={styles.bubbleTxtR}>{msg.text}</Text>
                  {msg.schema && (
                    <View style={styles.schemaBox}>
                      <View style={styles.schemaHeader}>
                        <PixelIcon type="stats" color={GREEN} size={10} />
                      </View>
                      <Text style={styles.schemaTxt}>{msg.schema}</Text>
                    </View>
                  )}
                </View>
              </View>
            ) : (
              /* Bulle joueur — noire, bordure verte, à droite */
              <View key={msg.id} style={styles.rowPlayer}>
                <View style={styles.bubbleP}>
                  <PixelIcon type="arrow-right" color={GREEN} size={10} />
                  <Text style={styles.bubbleTxtP}>{msg.text}</Text>
                </View>
              </View>
            )
          ))}

          {typing && (
            <View style={styles.rowRalsei}>
              <View style={styles.bubbleR}>
                <View style={styles.bubblePointer} />
                <View style={styles.dotsRow}>
                  <View style={[styles.dot, styles.dot1]} />
                  <View style={[styles.dot, styles.dot2]} />
                  <View style={[styles.dot, styles.dot3]} />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* ── Panel sélection questions — palette app ── */}
        <View style={styles.panel}>
          {/* Bande accent teal top */}
          <View style={styles.panelTopBorder} />

          {/* Onglets catégories — palette app */}
          <View style={styles.catRow}>
            {CAT_TABS.map(tab => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.catTab, cat === tab.id && styles.catTabOn]}
                onPress={() => setCat(tab.id)}
                activeOpacity={0.8}
              >
                <PixelIcon type={tab.icon} color={cat === tab.id ? '#2D3B2D' : '#5A6B5A'} size={13} />
                <Text style={[styles.catTabTxt, cat === tab.id && styles.catTabTxtOn]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Liste de questions — style app */}
          <ScrollView
            style={styles.qList}
            contentContainerStyle={styles.qListContent}
            showsVerticalScrollIndicator={false}
          >
            {QUESTIONS.filter(q => q.cat === cat).map((q, i) => (
              <TouchableOpacity
                key={q.id}
                style={[styles.qRow, i % 2 === 0 ? styles.qRowEven : styles.qRowOdd, typing && styles.qRowOff]}
                onPress={() => ask(q)}
                disabled={typing}
                activeOpacity={0.7}
              >
                {/* Curseur pixel teal */}
                <View style={styles.qCursor}>
                  <PixelIcon type="arrow-right" color="#7DC2A5" size={11} />
                </View>
                {/* Icône pixel */}
                <PixelIcon type={q.icon} color="#5A6B5A" size={13} />
                {/* Texte question */}
                <Text style={styles.qTxt}>{q.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ImageBackground>
    </Animated.View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex:1 },
  bg:   { flex:1, backgroundColor:'#050E05' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(0,0,0,0.65)' },
  safeTop: { height: Platform.OS==='android' ? (StatusBar as any).currentHeight||24 : 44 },

  /* Header — Ralsei centré grand */
  header: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: GREEN_DIM,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  faceFrame: {
    width: 140,
    height: 140,
    borderWidth: 3,
    borderColor: GREEN,
    backgroundColor: BLACK,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceCornerTL: { position:'absolute', top:-5,    left:-5,    width:10, height:10, backgroundColor:BLACK },
  faceCornerTR: { position:'absolute', top:-5,    right:-5,   width:10, height:10, backgroundColor:BLACK },
  faceCornerBL: { position:'absolute', bottom:-5, left:-5,    width:10, height:10, backgroundColor:BLACK },
  faceCornerBR: { position:'absolute', bottom:-5, right:-5,   width:10, height:10, backgroundColor:BLACK },
  faceImg: { width:130, height:130, backgroundColor:BLACK },

  nameTag: {
    backgroundColor: GREEN,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'center',
  },
  nameTagText: { fontFamily:'PressStart2P-Regular', fontSize:7, color:BLACK, letterSpacing:1 },
  shopTitle:   { fontFamily:'PressStart2P-Regular', fontSize:9, color:WHITE, letterSpacing:1 },
  shopDivider: { height:2, backgroundColor:GREEN_DIM, marginVertical:2 },
  shopSub:     { fontFamily:'PressStart2P-Regular', fontSize:5.5, color:GREEN, letterSpacing:0.5 },

  /* Chat */
  chatArea:    { maxHeight: SH * 0.30 },
  chatContent: { padding:10, gap:10 },

  rowRalsei: { flexDirection:'row', alignItems:'flex-start' },
  rowPlayer: { flexDirection:'row', justifyContent:'flex-end' },

  bubbleR: {
    maxWidth:'87%',
    backgroundColor: WHITE,
    borderWidth: 2,
    borderColor: BLACK,
    padding: 10,
    position: 'relative',
    marginLeft: 8,
  },
  bubblePointer: {
    position:'absolute',
    left:-8, top:12,
    width:0, height:0,
    borderTopWidth:6, borderTopColor:'transparent',
    borderBottomWidth:6, borderBottomColor:'transparent',
    borderRightWidth:8, borderRightColor:BLACK,
  },
  bubbleTxtR: { fontFamily:'PressStart2P-Regular', fontSize:7, color:BLACK, lineHeight:14 },

  bubbleP: {
    maxWidth:'80%',
    flexDirection:'row',
    alignItems:'center',
    gap:8,
    backgroundColor: BLACK,
    borderWidth: 2,
    borderColor: GREEN,
    paddingVertical:8,
    paddingHorizontal:10,
  },
  bubbleTxtP: { fontFamily:'PressStart2P-Regular', fontSize:6.5, color:GREEN, flex:1, lineHeight:13 },

  /* Schéma stats */
  schemaBox: {
    marginTop:8,
    backgroundColor:'rgba(0,0,0,0.07)',
    borderWidth:1,
    borderColor:'rgba(0,0,0,0.15)',
    padding:8,
  },
  schemaHeader: { marginBottom:4 },
  schemaTxt: { fontFamily:'PressStart2P-Regular', fontSize:5.5, color:BLACK, lineHeight:11 },

  /* Points d'attente */
  dotsRow: { flexDirection:'row', gap:5, padding:4 },
  dot: { width:8, height:8, backgroundColor:'#888' },
  dot1: {}, dot2: {}, dot3: {},

  /* Panel questions — palette app */
  panel: {
    flex: 1,
    backgroundColor: '#E3EBD0',   // SAGE_LIGHT
    borderTopWidth: 0,
  },
  panelTopBorder: { height: 4, backgroundColor: '#7DC2A5' },

  catRow: {
    flexDirection: 'row',
    backgroundColor: '#C7DDC5',   // SAGE_MID
    borderBottomWidth: 2,
    borderBottomColor: '#9FCDA8', // SAGE_DARK
  },
  catTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    gap: 6,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  catTabOn: {
    backgroundColor: '#F1F1D3',   // CREAM
    borderBottomColor: '#7DC2A5', // TEAL
  },
  catTabTxt: {
    fontFamily: 'PressStart2P-Regular',
    fontSize: 6.5,
    color: '#5A6B5A',             // INK_LIGHT
    letterSpacing: 0.5,
  },
  catTabTxtOn: {
    color: '#2D3B2D',             // INK
  },

  qList: { flex: 1 },
  qListContent: { paddingVertical: 2, paddingBottom: 120 },

  qRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#C7DDC5',
  },
  qRowEven: { backgroundColor: '#F1F1D3' },   // CREAM
  qRowOdd:  { backgroundColor: '#E3EBD0' },   // SAGE_LIGHT
  qRowOff:  { opacity: 0.35 },
  qCursor:  { width: 16, alignItems: 'center' },
  qTxt: {
    fontFamily: 'PressStart2P-Regular',
    fontSize: 7,
    color: '#2D3B2D',             // INK
    flex: 1,
    lineHeight: 14,
  },
});

export default HistoryScreen;
