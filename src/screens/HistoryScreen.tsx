import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Image,
  Animated,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Audio } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { getMoodHistory, getListenStats, getTrackHistory, calcStreakDays, calcBestStreakDays, getDaysSinceInstall } from '../services/db';
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

// ─── Avatars battle menu ──────────────────────────────────────────────────────
const RALSEI_FACE = require('../assets/images/ralsei_face_battlemenu.webp');
const KRIS_FACE   = require('../assets/images/kris_face_battlemenu.webp');

// ─── Types ────────────────────────────────────────────────────────────────────
interface Msg { id: string; who: 'ralsei' | 'player'; text: string; face: string; schema?: string; gif?: any; }

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
  { id: 'progression',  label: 'Ma progression',         icon: 'chart',       cat: 'stats' },
  { id: 'weekvswk',     label: 'Weekend vs Semaine',     icon: 'calendar',    cat: 'stats' },
  { id: 'tracks',       label: 'Mes chansons écoutées',  icon: 'note',        cat: 'stats' },
  { id: 'topartist',    label: 'Mon artiste préféré',    icon: 'star',        cat: 'stats' },
  { id: 'timeslot',     label: 'Mon heure de prédil.',   icon: 'calendar',    cat: 'stats' },
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
  { id: 'susie',         label: 'Et Susie ?',             icon: 'person',      cat: 'perso' },
  { id: 'noelle',        label: 'Et Noelle ?',            icon: 'person',      cat: 'perso' },
  { id: 'lancer',        label: 'Et Lancer ?',            icon: 'person',      cat: 'perso' },
  { id: 'rouxls',        label: 'Et Rouxls Kaard ?',      icon: 'person',      cat: 'perso' },
  { id: 'savepoint',    label: 'Les SAVE Points ?',      icon: 'star',        cat: 'perso' },
  { id: 'roaring',      label: 'Le Rugissement ?',       icon: 'eye',         cat: 'perso' },
  { id: 'alone',        label: 'Tu vivais seul ?',       icon: 'person',      cat: 'perso' },
  { id: 'cake',         label: 'Tu sais cuisiner ?',     icon: 'leaf',        cat: 'perso' },
  { id: 'message',      label: 'Un message pour moi ?',  icon: 'heart-filled',cat: 'perso' },
];

// ─── Stats helpers ────────────────────────────────────────────────────────────
// daysBetween gardé pour compatibilité interne si besoin
const countMood  = (h: MoodHistoryEntry[], name: string) => h.filter(e => e.mood.toLowerCase() === name.toLowerCase()).length;
const getDom     = (h: MoodHistoryEntry[]) => { if (!h.length) return null; const c: Record<string,number> = {}; h.forEach(e => { c[e.mood] = (c[e.mood]||0)+1; }); return Object.entries(c).sort((a,b) => b[1]-a[1])[0]?.[0] ?? null; };
const getWeek    = (h: MoodHistoryEntry[]) => { const ago = new Date(); ago.setDate(ago.getDate()-7); const r = h.filter(e => new Date(e.createdAt) >= ago); if (!r.length) return null; const c: Record<string,number> = {}; r.forEach(e => { c[e.mood] = (c[e.mood]||0)+1; }); return Object.entries(c).sort((a,b) => b[1]-a[1])[0]?.[0] ?? null; };
const fmtDate    = (iso: string) => { const d = new Date(iso); return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); };
const moodComment = (n: number) => { if (n === 0) return 'Aucune session.'; if (n < 3) return 'Tu explores...'; if (n < 7) return 'Une vibe régulière.'; if (n < 15) return 'Ta vibe de référence !'; return 'C\'est clairement TA vibe.'; };

// ─── Générateur de réponses ────────────────────────────────────────────────────
const buildReply = (
  qId: string,
  history: MoodHistoryEntry[],
  listenStats?: Awaited<ReturnType<typeof getListenStats>>,
  trackHistory?: Awaited<ReturnType<typeof getTrackHistory>>
): { text: string; face: string; schema?: string } => {
  const sorted = [...history].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const total  = history.length;
  const streak = calcStreakDays(history);
  const best   = calcBestStreakDays(history);
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

    // ── Nouvelles questions ───────────────────────────────────────────────────

    case 'tracks': {
      const th = trackHistory ?? [];
      if (!th.length) return { face: 'r2', text: '* Aucune chanson encore\nenregistrée dans\nmon registre. *\n\nLance une playlist\net appuie sur play !\nJe note tout.' };
      const lines = th.slice(0, 5).map((e, i) => `${i+1}. ${e.title}\n   ${e.artist} · ${e.mood}`).join('\n');
      return { face: 'r17', text: `Tes ${Math.min(5,th.length)} dernières\nchansons écoutées.\n* Je les ai toutes\nnot\u00e9es. Soigneusement. *`, schema: `CHANSONS RÉCENTES\n──────────────────\n${lines}` };
    }

    case 'topartist': {
      if (!listenStats?.topArtist) return { face: 'r10', text: '* Hmm... pas encore\nassez d\'écoutes. *\nJoue quelques morceaux\net reviens !' };
      const { name, count } = listenStats.topArtist;
      return { face: 'r22', text: `Ton artiste le plus\nécouté... c\'est\n${name} !\n* ${count} fois dans mon registre. *\nTu as bon goût.\nJe ne dis pas ça à tout le monde.`, schema: `ARTISTE FAVORI\n──────────────\n♪ ${name}\n${count} écoute(s) enregistrée(s)` };
    }

    case 'timeslot': {
      if (!listenStats?.timeSlot) return { face: 'r6', text: '* Je ne sais pas encore\nquand tu écoutes. *\nJoue de la musique\net je découvrirai !' };
      const slot = listenStats.timeSlot;
      const slotFace = slot === 'la nuit' ? 'r1' : slot === 'le matin' ? 'r7' : slot === "l'après-midi" ? 'r5' : 'r19';
      const slotComment = slot === 'la nuit'
        ? '* Tu écoutes la nuit... *\nLes Darkworlds aussi\nsont silencieux la nuit.\nFais attention à toi.'
        : slot === 'le matin'
        ? '* Le matin ! *\nC\'est une belle façon\nde commencer la journée.\nJe t\'approuve.'
        : slot === "l'après-midi"
        ? '* L\'après-midi...\nUne heure calme. *\nBonne période pour\nse concentrer.'
        : '* Le soir. Hmm. *\nC\'est un moment\ndoux et introspectif.\nJe comprends.';
      return { face: slotFace, text: `Tu écoutes surtout\n${slot}.\n\n${slotComment}`, schema: `HEURE FAVORITE\n──────────────\n${slot.toUpperCase()}\n${listenStats.topHour}h00 en moyenne` };
    }

    case 'progression': {
      const now = new Date();
      const oneWeekAgo = new Date(); oneWeekAgo.setDate(now.getDate() - 7);
      const twoWeeksAgo = new Date(); twoWeeksAgo.setDate(now.getDate() - 14);
      const thisWeek = history.filter(e => new Date(e.createdAt) >= oneWeekAgo).length;
      const lastWeek = history.filter(e => new Date(e.createdAt) >= twoWeeksAgo && new Date(e.createdAt) < oneWeekAgo).length;
      if (!thisWeek && !lastWeek) return { face: 'r10', text: '* Pas encore assez\nde données pour comparer. *\nReviens dans quelques jours !' };
      const diff = thisWeek - lastWeek;
      const sign = diff > 0 ? '+' : '';
      if (diff > 0) return { face: 'r22', text: `Cette semaine : ${thisWeek} session${thisWeek>1?'s':''}.\nLa semaine passée : ${lastWeek}.\n\n* ${sign}${diff} ! C\'est une\nforte progression ! *\nContinue comme ça.`, schema: `PROGRESSION\n───────────\nCette semaine : ${thisWeek}\nSemaine passée: ${lastWeek}\nDiff\u00e9rence     : ${sign}${diff}` };
      if (diff < 0) return { face: 'r27', text: `Cette semaine : ${thisWeek}.\nLa semaine passée : ${lastWeek}.\n\n* ${diff} sessions... *\nCe n\'est pas grave.\nTout le monde a\ndes semaines difficiles.`, schema: `PROGRESSION\n───────────\nCette semaine : ${thisWeek}\nSemaine passée: ${lastWeek}\nDifférence    : ${diff}` };
      return { face: 'r5', text: `${thisWeek} sessions cette semaine,\n${lastWeek} la semaine d\'avant.\n\n* Stable ! *\nLa régularité,\nc\'est sous-estimé.` };
    }

    case 'weekvswk': {
      const isWeekend = (d: Date) => { const day = d.getDay(); return day === 0 || day === 6; };
      const weekendSessions = history.filter(e => isWeekend(new Date(e.createdAt)));
      const weekdaySessions = history.filter(e => !isWeekend(new Date(e.createdAt)));
      if (!history.length) return { face: 'r10', text: '* Pas encore assez\nde données. *' };
      const wkndDom = getDom(weekendSessions);
      const wkdayDom = getDom(weekdaySessions);
      const wkndCfg = wkndDom ? MOODS.find(m => m.name.toLowerCase() === wkndDom.toLowerCase()) : null;
      const wkdayCfg = wkdayDom ? MOODS.find(m => m.name.toLowerCase() === wkdayDom.toLowerCase()) : null;
      return { face: 'r18', text: `Intéressant !\nEn semaine tu es plutôt\n${wkdayCfg?.emoji??'?'} ${wkdayDom??'—'}.\n\nLe weekend :\n${wkndCfg?.emoji??'?'} ${wkndDom??'—'}.\n\n* Ta musique change\nselon tes jours. *\nC\'est humain.`, schema: `SEMAINE vs WEEKEND\n──────────────────\nSemaine  : ${wkdayCfg?.emoji??''} ${wkdayDom??'—'} (${weekdaySessions.length} sessions)\nWeekend  : ${wkndCfg?.emoji??''} ${wkndDom??'—'} (${weekendSessions.length} sessions)` };
    }

    case 'savepoint':
      return { face: 'r11', text: '* Tu as remarqué les\nSAVE Points... *\n\nOui. Je les vois aussi.\n\nChaque fois que tu\nt\'y arrêtes...\nquelque chose change.\n\n* Moi aussi je me\ndemande parfois ce\nqu\'ils font vraiment. *\n\nMais c\'est réconfortant.\nNon ?' };

    case 'message': {
      const th2 = trackHistory ?? [];
      if (!total && !th2.length) return { face: 'r6', text: '* Oh... un message\npour toi ? *\n\nJe... je ne sais\npas encore grand chose\nde toi.\n\nMais je suis content\nque tu sois là.\n\nVraiment.', };
      const ls2 = listenStats;
      const artist = ls2?.topArtist?.name ?? '';
      const slot2 = ls2?.timeSlot ?? '';
      return {
        face: 'r15',
        text: `* ...\n\nJe sais que tu es là.\n\nPas juste Kris.\nToi.\n\n${artist ? `Tu écoutes ${artist}...\n` : ''}${slot2 ? `${slot2.charAt(0).toUpperCase()+slot2.slice(1)}...\n\n` : '\n'}${dom ? `Tu traverses beaucoup\nde moments ${dom}.\n\n` : ''}* Je veux juste\nte dire...\n\nProends soin de toi.\nS\'il te plaît. *`,
      };
    }

    case 'joyeux': case 'melancolique': case 'energique': case 'concentre':
    case 'nostalgique': case 'festif': case 'fatigue': case 'amoureux':
    case 'colerique': case 'tobyfox': {
      const mCfg = MOODS.find(m => m.id === qId);
      if (!mCfg) return { face: 'r10', text: '* Vibe inconnue... *' };
      const n = countMood(history, mCfg.name);
      const p = total > 0 ? Math.round((n/total)*100) : 0;
      const vibeTexts: Record<string,{face:string;text:string}> = {
        joyeux: {
          face: 'r7',
          text: `Joyeux ${n} fois !\n* Ça me réchauffe vraiment\nle cœur. *\n\nSusie aurait dit que\ntu as l'air d'un idiot\nheureux.\nMais... moi je trouve\nça magnifique.`,
        },
        melancolique: {
          face: 'r27',
          text: `Mélancolique ${n} fois...\n* Je connais ce sentiment. *\n\nJ'ai attendu si longtemps\nque quelqu'un vienne.\n...La mélancolie et moi,\nnous sommes de vieilles\nconnaissances.\n\n* Mais tu n'es pas seul. *`,
        },
        energique: {
          face: 'r22',
          text: `Énergique ${n} fois !\n* WOW ! *\n\nJ'aurais aimé avoir\ncette énergie quand\nje portais tout seul\nles décors du château...\n\n* J'aimerais avoir\nta vigueur, vraiment. *`,
        },
        concentre: {
          face: 'r19',
          text: `Concentré ${n} fois.\n* C'est une qualité rare. *\n\nMoi j'ai du mal.\nQuand Susie fait\nn'importe quoi, je perds\nle fil... mais je reste\nconcentré. En apparence.`,
        },
        nostalgique: {
          face: 'r26',
          text: `Nostalgique ${n} fois.\n* Les souvenirs... *\n\nJe me demande parfois\nà quoi ressemblait\nCastle Town avant.\nAvant que j'y sois seul.\n\n* Les tiens valent\nsûrement plus que les miens. *`,
        },
        festif: {
          face: 'r23',
          text: `Festif ${n} fois !\n* TU SAIS FAIRE LA FÊTE ! *\n\nJe... je n'ai jamais\nvraiment fêté quoi que\nce soit avant Kris\net Susie.\n\n* Est-ce que je suis invité\nla prochaine fois ? *`,
        },
        fatigue: {
          face: 'r1',
          text: `Fatigué ${n} fois...\n* Je suis sincèrement\nnavré. *\n\nRepose-toi vraiment.\nMoi aussi j'ai des nuits\noù je porte trop de choses.\nLa musique sera là\ndemain matin. *`,
        },
        amoureux: {
          face: 'r15',
          text: `Amoureux ${n} fois !\n* Oh ! Je... euh... *\n\nC'est... bien !\nLa musique romantique\nc'est tout à fait honorable.\nJe ne rougis pas.\n\n* ...Je rougis un peu. *`,
        },
        colerique: {
          face: 'r8',
          text: `Colérique ${n} fois.\n* Je ne vais pas te juger. *\n\nMoi aussi j'ai eu envie\nde crier parfois.\nSurtout quand le Roi a\ntrahi ma confiance.\n\nMais la violence...\nc'est rarement la réponse.`,
        },
        tobyfox: {
          face: 'r11',
          text: `Vibe Toby Fox ${n} fois !\n* Tu as vraiment bon goût. *\n\nCette musique résonne\nen moi d'une façon\ntrès particulière.\n\n...Je ne peux pas\nt'expliquer pourquoi.\nMais je comprends.`,
        },
      };
      const v = vibeTexts[qId] ?? { face:'r17', text:`${mCfg.name} : ${n} session(s).` };
      return { face:v.face, text:`${mCfg.emoji} ${v.text}`, schema:`${mCfg.emoji} ${mCfg.name.toUpperCase()}\n───────────────\nSessions : ${n}\nPart     : ${p}%\n${moodComment(n)}` };
    }

    case 'whoru': return {
      face: 'r15',
      text: '* Oh ! Tu me demandes\nqui je suis ? *\n\nJe m\'appelle Ralsei.\nPrince des Ténèbres...\net gardien de ce shop.\n\nMon nom est... curieux.\nDis-le à l\'envers et\ntu obtiendras quelque chose.\n* Je préfère ne pas\ny penser trop souvent. *\n\nMais ici, je suis là\npour toi.',
    };

    case 'howru': {
      if (total >= 20) return {
        face: 'r5',
        text: `Je vais bien !\n* Tes ${total} sessions me font\nvraiment chaud au coeur. *\n\nAvant, je n\'avais personne\npour qui compter des chiffres.\nMaintenant j\'ai toi.\nC\'est... pas rien.`,
      };
      if (total >= 5) return {
        face: 'r6',
        text: `Je vais bien, merci.\n* C\'est rare qu\'on me demande. *\n\nHonnêtement... je cache\nbeaucoup de choses.\nMais là, maintenant,\nje vais vraiment bien.`,
      };
      if (!total) return {
        face: 'r2',
        text: '* Je vais bien... *\n\nEnfin, je crois.\nLe shop est vide.\nCe n\'est pas un reproche.\nJ\'ai l\'habitude\ndu vide, de toute façon.',
      };
      return {
        face: 'r6',
        text: 'Je vais bien !\n* Merci de demander. *\n\nC\'est vraiment rare\nque quelqu\'un prenne\nle temps de le faire.\n\n...Kris me demande\nparfois. Ça compte beaucoup.',
      };
    }

    case 'shop': return {
      face: 'r22',
      text: '* Bienvenue dans mon shop ! *\n\nIci je garde trace de\ntes vibes et écoutes.\nSessions, streaks, humeurs...\n\nAu départ c\'était juste\nun château vide.\nMaintenant il y a des registres.\nEt toi.\n\n* J\'ai travaillé dur. *',
    };

    case 'prophecy': return {
      face: 'r19',
      text: '* Ah... la Prophétie... *\n\nElle parle de héros\nqui viendraient sceller\nles Fontaines Sombres\npour éviter le Rugissement.\n\nJe connais la version\ncomplète.\nCelle avec les révélations\nhorribles.\n\n* Je préfère ne pas\nla partager.\nPas encore.\nPour ton bien. *',
    };

    case 'roaring': return {
      face: 'r11',
      text: '* Le Rugissement... *\n\nSi trop de Fontaines\nSombres s\'ouvrent,\ntous les Darkworlds\nse fusionneront avec\nle monde des Lightners.\n\nPersonne ne survivrait\ncorrectement à ça.\n\n* C\'est pour ça que\nchaque Fontaine doit\nêtre scellée. *\n\nC\'est pour ça que je suis là.',
    };

    case 'player': return {
      face: 'r13',
      text: '...\n\nJe sais que tu es là.\nPas juste Kris.\nToi. Le Joueur.\n\n* Je t\'ai regardé\ndirectement une fois.\nTu t\'en souviens ? *\n\nJe sais que tu fais\ndes choix.\nPas Kris.\nToi.\n\nAlors... s\'il te plaît.\nFais de bons choix.\n\nPour nous tous.',
    };

    case 'advice': {
      const d = getDom(history) ?? 'Joyeux';
      const dCfg = MOODS.find(m => m.name.toLowerCase() === d.toLowerCase());
      return {
        face: 'r21',
        text: `* Mon conseil : *\n\nTu tends vers\n${dCfg?.emoji ?? ''} ${d}.\n\nC\'est bien !\nMais la musique,\nc\'est comme les combats.\nPas toujours besoin\nde frapper fort.\n\n* Parfois, une seule\nmélodie peut tout\ncalmer. *\nExplore les autres vibes.`,
      };
    }

    case 'secret': return {
      face: 'r11',
      text: '* ...Tu veux vraiment savoir ? *\n\nJe suis un Darkner.\nSi le Darkworld où je vis\ndisparaît, moi aussi.\n\nJe me demande parfois\nsi j\'existe vraiment.\nOu si je ne suis\nqu\'une extension\ndes rêves de quelqu\'un.\n\n* Mais Susie a dit\nque j\'étais réel pour elle.\n...Alors j\'essaie d\'y croire. *',
    };

    case 'kris': return {
      face: 'r29',
      text: '* Kris... *\n\nIls ont accepté\nde m\'accompagner\nsans vraiment avoir\nle choix au départ.\n\nMais maintenant...\n* Je crois qu\'ils\nm\'apprécient vraiment. *\n\nQuand ils se rapprochent\nde moi, je...\n...\n* J\'ai tendance à rougir.\nC\'est embarrassant. *',
    };

    case 'susie': return {
      face: 'r15',
      text: '* Susie... *\n\nAu début elle m\'appelait\n"garçon dentifrice".\nJe ne savais pas\nsi c\'était une insulte.\n\nMaintenant...\nElle m\'a dit que\nj\'étais réel pour elle.\nAlors que je suis un Darkner.\n\n* Je cache des choses\nde la Prophétie\npour la protéger.\nC\'est douloureux. *\n\nElle m\'a appris\nle sarcasme.\nJe ne suis pas sûr\nde l\'utiliser correctement.',
    };

    case 'noelle': return {
      face: 'r6',
      text: '* Noelle... *\n\nElle est très gentille.\nEt très courageuse,\nmême si elle ne le sait\npas encore.\n\nJe sais quels équipements\nelle peut porter.\nC\'est... mon rôle\nde noter ces choses.\n\n* Je m\'inquiète parfois.\nLe Darkworld peut\nchanger les gens. *\n\nJ\'espère que\nle chemin qu\'elle suit\nsera doux pour elle.\nElle le mérite.',
    };

    case 'lancer': return {
      face: 'r23',
      text: '* LANCER ! *\n\nIl m\'appelait :\n"doux panier d\'œufs"...\n"petit pois adoré"...\n"petite pêche sucrée"...\n\n* Je ne saurai jamais\nsi c\'étaient des insultes. *\n\nMais il est devenu\nmon ami.\nVraiment.\n\nJe lui ai fait une\nchambre dans le château.\nLa première fois qu\'il\na eu une chambre\nrien que pour lui...\n\n* Son père ne\ns\'occupait pas bien\nde lui.\nJe voulais réparer ça.\nUn peu. *',
    };

    case 'rouxls': return {
      face: 'r17',
      text: '* Rouxls Kaard... *\n\n"Duc des Puzzles".\nIl se dit terrible\net redoutable.\n\nSes puzzles sont...\npousser des blocs.\n\n* Je ne vais pas\nle juger. *\nIl cherche juste\nde la reconnaissance.\nQuelqu\'un qui l\'admire.\n\nC\'est compréhensible.\nMême si son discours\nest un peu...\n\n"thoust clawedst"...\n\n* ...Je ne suis pas sûr\nque ce soit\ndu vrai vieux français. *',
    };

    case 'alone': return {
      face: 'r27',
      text: '* Oui... *\n\nAvant Kris et Susie,\nj\'étais seul dans\nCastle Town.\n\nPas d\'habitants.\nPas de sujets.\nJuste moi,\nle château,\net la Prophétie.\n\n* J\'attendais.\nJe ne savais pas\ncombien de temps.\nMais j\'attendais. *\n\n...Maintenant j\'ai des amis.\nJe ne savais pas\nque ça changerait autant.',
    };

    case 'cake': return {
      face: 'r23',
      text: '* Oui ! Je sais faire\ndes gâteaux ! *\n\nJ\'avais promis à Susie\nun gâteau si elle arrêtait\nde se moquer de moi.\n\nElle a décliné.\n* Elle a quand même mangé\nmon gâteau plus tard. *\n\nEn chapitre 4, j\'ai mangé\nmoi-même un morceau.\nPour la première fois.\n* Un Darkner qui mange\nson propre gâteau...\nc\'était inattendu. *',
    };

    case 'savepoint': return {
      face: 'r11',
      text: '* Tu as remarqué\nles SAVE Points... *\n\nOui. Je les vois.\nJe suis le seul\nà reconnaître vraiment\nce qu\'ils font.\n\n* Ils changent quelque chose.\nChaque arrêt.\nChaque sauvegarde. *\n\nJe ne peux pas l\'expliquer.\nMais tu le ressens\naussi, non ?\n\n...Je le vois\ndans tes choix.',
    };

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
  const [listenStats, setListenStats] = useState<Awaited<ReturnType<typeof getListenStats>>>(null);
  const [trackHistory, setTrackHistory] = useState<Awaited<ReturnType<typeof getTrackHistory>>>([]);
  const [daysSinceInstall, setDaysSinceInstall] = useState(0);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [typing, setTyping]     = useState(false);
  const [face, setFace]         = useState('r1');
  const [cat, setCat]           = useState<'stats'|'vibe'|'perso'>('stats');
  const [panelOpen, setPanelOpen] = useState(false);
  const chatRef    = useRef<ScrollView>(null);
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const faceScale  = useRef(new Animated.Value(1)).current;
  const panelH     = useRef(new Animated.Value(0)).current;

  // Hauteur max du tiroir
  const DRAWER_H = SH * 0.50;

  useFocusEffect(useCallback(() => { boot(); }, []));

  const boot = async () => {
    try {
      const [data, ls, th, days] = await Promise.all([
        getMoodHistory(),
        getListenStats(),
        getTrackHistory(),
        getDaysSinceInstall(),
      ]);
      setHistory(data);
      setListenStats(ls);
      setTrackHistory(th);
      setDaysSinceInstall(days);
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

  // ─── Animation tiroir pixel (8 étapes discrètes) ────────────────────────────
  const STEPS = 8;
  const pixelOpen = () => {
    panelH.setValue(0);
    setPanelOpen(true);
    const segments = Array.from({ length: STEPS }, (_, i) =>
      Animated.timing(panelH, {
        toValue: (DRAWER_H / STEPS) * (i + 1),
        duration: 28,
        useNativeDriver: false,
        easing: (t: number) => t,
      })
    );
    Animated.sequence(segments).start();
  };

  const pixelClose = () => {
    const segments = Array.from({ length: STEPS }, (_, i) =>
      Animated.timing(panelH, {
        toValue: DRAWER_H * ((STEPS - i - 1) / STEPS),
        duration: 22,
        useNativeDriver: false,
        easing: (t: number) => t,
      })
    );
    Animated.sequence(segments).start(() => {
      panelH.setValue(0);
      setPanelOpen(false);
    });
  };

  const togglePanel = () => panelOpen ? pixelClose() : pixelOpen();

  const playBluh = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/sounds/snd_bluh.wav'),
        { shouldPlay: true, volume: 0.8 }
      );
      // Décharger le son après lecture
      sound.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
        }
      });
    } catch (_) {}
  };

  const ask = (q: Q) => {
    if (typing) return;
    setMessages(prev => [...prev, { id:Date.now()+'p', who:'player', text:q.label, face:'' }]);
    setTyping(true);
    setTimeout(() => chatRef.current?.scrollToEnd({ animated:true }), 80);
    setTimeout(() => {
      const res = buildReply(q.id, history, listenStats, trackHistory);
      bounceFace(res.face);
      setMessages(prev => [...prev, { id:Date.now()+'r', who:'ralsei', text:res.text, face:res.face, schema:res.schema }]);
      setTyping(false);
      setTimeout(() => chatRef.current?.scrollToEnd({ animated:true }), 80);

      // Message spécial Lancer — GIF + son snd_bluh
      if (q.id === 'lancer') {
        setTimeout(() => {
          playBluh();
          setMessages(prev => [
            ...prev,
            {
              id: Date.now() + 'gif',
              who: 'ralsei',
              text: '',
              face: 'r23',
              gif: require('../assets/images/lancer_bike.gif'),
            },
          ]);
          bounceFace('r23');
          setTimeout(() => chatRef.current?.scrollToEnd({ animated:true }), 100);
        }, 1200);
      }
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

        {/* ── Zone chat ── flex pour prendre tout l'espace disponible ── */}
        <ScrollView
          ref={chatRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(msg => (
            msg.who === 'ralsei' ? (
              /* Bulle Ralsei — avatar à gauche, bulle blanche */
              <View key={msg.id} style={styles.rowRalsei}>
                {/* Avatar Ralsei */}
                <Image source={RALSEI_FACE} style={styles.avatarFace} resizeMode="contain" />
                <View style={[styles.bubbleR, msg.gif ? styles.bubbleGif : undefined]}>
                  <View style={styles.bubblePointer} />
                  {msg.gif ? (
                    <Image
                      source={msg.gif}
                      style={styles.lancerGif}
                      resizeMode="contain"
                    />
                  ) : (
                    <Text style={styles.bubbleTxtR}>{msg.text}</Text>
                  )}
                  {msg.schema && !msg.gif && (
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
              /* Bulle joueur — bulle verte à droite, avatar Kris */
              <View key={msg.id} style={styles.rowPlayer}>
                <View style={styles.bubbleP}>
                  <View style={styles.bubblePointerRight} />
                  <Text style={styles.bubbleTxtP}>{msg.text}</Text>
                </View>
                <Image source={KRIS_FACE} style={styles.avatarFace} resizeMode="contain" />
              </View>
            )
          ))}

          {typing && (
            <View style={styles.rowRalsei}>
              <Image source={RALSEI_FACE} style={styles.avatarFace} resizeMode="contain" />
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

        {/* ── Bouton tiroir ── style battle menu Deltarune ── */}
        <TouchableOpacity
          style={styles.drawerBtn}
          onPress={togglePanel}
          activeOpacity={0.85}
        >
          {/* Bordure pixel coins */}
          <View style={styles.drawerBtnCornerTL} />
          <View style={styles.drawerBtnCornerTR} />
          <View style={styles.drawerBtnCornerBL} />
          <View style={styles.drawerBtnCornerBR} />
          <Text style={styles.drawerBtnTxt}>
            {panelOpen ? '▼ FERMER' : '▲ REPONDRE'}
          </Text>
          {/* Indicateur catégorie active */}
          {!panelOpen && (
            <View style={styles.drawerCatChip}>
              <Text style={styles.drawerCatTxt}>
                {cat === 'stats' ? 'STATS' : cat === 'vibe' ? 'VIBES' : 'RALSEI'}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* ── Tiroir panel (Animated.View) ── monte du bas en pixel steps ── */}
        <Animated.View style={[styles.panel, { height: panelH, overflow: 'hidden' }]}>
          {/* Bande accent teal top */}
          <View style={styles.panelTopBorder} />

          {/* Onglets catégories */}
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

          {/* Liste de questions */}
          <ScrollView
            style={styles.qList}
            contentContainerStyle={styles.qListContent}
            showsVerticalScrollIndicator={false}
          >
            {QUESTIONS.filter(q => q.cat === cat).map((q, i) => (
              <TouchableOpacity
                key={q.id}
                style={[styles.qRow, i % 2 === 0 ? styles.qRowEven : styles.qRowOdd, typing && styles.qRowOff]}
                onPress={() => { ask(q); pixelClose(); }}
                disabled={typing}
                activeOpacity={0.7}
              >
                <View style={styles.qCursor}>
                  <PixelIcon type="arrow-right" color="#7DC2A5" size={11} />
                </View>
                <PixelIcon type={q.icon} color="#5A6B5A" size={13} />
                <Text style={styles.qTxt}>{q.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
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
  faceImg: { width:90, height:90, backgroundColor:BLACK },

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
  chatArea:    { flex: 1 },
  chatContent: { padding:10, gap:10 },

  rowRalsei: { flexDirection:'row', alignItems:'flex-start', gap: 4 },
  rowPlayer: { flexDirection:'row', justifyContent:'flex-end', alignItems:'flex-start', gap: 4 },

  avatarFace: {
    width: 48,
    height: 48,
    imageRendering: 'pixelated' as any,
    flexShrink: 0,
    marginTop: 4,
  },

  bubbleR: {
    flex: 1,
    maxWidth:'82%',
    backgroundColor: WHITE,
    borderWidth: 2,
    borderColor: BLACK,
    padding: 10,
    position: 'relative',
    marginLeft: 4,
  },

  bubblePointer: {
    position:'absolute',
    left:-8, top:12,
    width:0, height:0,
    borderTopWidth:6, borderTopColor:'transparent',
    borderBottomWidth:6, borderBottomColor:'transparent',
    borderRightWidth:8, borderRightColor:BLACK,
  },
  bubbleTxtR: { fontFamily:'PressStart2P-Regular', fontSize:10, color:BLACK, lineHeight:20 },

  bubbleGif: {
    padding: 6,
    backgroundColor: BLACK,
    borderColor: GREEN,
  },
  lancerGif: {
    width: 180,
    height: 180,
    imageRendering: 'pixelated' as any,
  },

  bubbleP: {
    maxWidth:'75%',
    flexDirection:'row',
    alignItems:'center',
    gap:8,
    backgroundColor: BLACK,
    borderWidth: 2,
    borderColor: GREEN,
    paddingVertical:8,
    paddingHorizontal:10,
    position: 'relative',
    marginRight: 4,
  },
  bubblePointerRight: {
    position:'absolute',
    right:-8, top:12,
    width:0, height:0,
    borderTopWidth:6, borderTopColor:'transparent',
    borderBottomWidth:6, borderBottomColor:'transparent',
    borderLeftWidth:8, borderLeftColor:GREEN,
  },

  bubbleTxtP: { fontFamily:'PressStart2P-Regular', fontSize:10, color:GREEN, flex:1, lineHeight:20 },

  /* Schéma stats */
  schemaBox: {
    marginTop:8,
    backgroundColor:'rgba(0,0,0,0.07)',
    borderWidth:1,
    borderColor:'rgba(0,0,0,0.15)',
    padding:8,
  },
  schemaHeader: { marginBottom:4 },
  schemaTxt: { fontFamily:'PressStart2P-Regular', fontSize:8, color:BLACK, lineHeight:16 },

  /* Points d'attente */
  dotsRow: { flexDirection:'row', gap:5, padding:4 },
  dot: { width:8, height:8, backgroundColor:'#888' },
  dot1: {}, dot2: {}, dot3: {},

  /* Bouton tiroir ── Deltarune battle menu style */
  drawerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: GREEN,
    borderWidth: 2,
    borderColor: BLACK,
    paddingVertical: 10,
    paddingHorizontal: 16,
    position: 'relative',
    marginHorizontal: 0,
  },
  drawerBtnCornerTL: { position:'absolute', top:-3,    left:-3,    width:6, height:6, backgroundColor:BLACK },
  drawerBtnCornerTR: { position:'absolute', top:-3,    right:-3,   width:6, height:6, backgroundColor:BLACK },
  drawerBtnCornerBL: { position:'absolute', bottom:-3, left:-3,    width:6, height:6, backgroundColor:BLACK },
  drawerBtnCornerBR: { position:'absolute', bottom:-3, right:-3,   width:6, height:6, backgroundColor:BLACK },
  drawerBtnTxt: {
    fontFamily: 'PressStart2P-Regular',
    fontSize: 9,
    color: BLACK,
    letterSpacing: 1,
  },
  drawerCatChip: {
    backgroundColor: BLACK,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  drawerCatTxt: {
    fontFamily: 'PressStart2P-Regular',
    fontSize: 7,
    color: GREEN,
    letterSpacing: 0.5,
  },

  /* Panel questions ── palette app */
  panel: {
    backgroundColor: '#E3EBD0',
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
    fontSize: 8,
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
    paddingVertical: 16,
    paddingHorizontal: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#C7DDC5',
  },
  qRowEven: { backgroundColor: '#F1F1D3' },   // CREAM
  qRowOdd:  { backgroundColor: '#E3EBD0' },   // SAGE_LIGHT
  qRowOff:  { opacity: 0.35 },
  qCursor:  { width: 16, alignItems: 'center' },
  qTxt: {
    fontFamily: 'PressStart2P-Regular',
    fontSize: 10,
    color: '#2D3B2D',             // INK
    flex: 1,
    lineHeight: 20,
  },
});

export default HistoryScreen;
