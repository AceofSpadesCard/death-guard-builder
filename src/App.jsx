import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Shield, Zap, Box, Calculator, CheckCircle2, Circle, AlertTriangle, Settings2, X, Save, RotateCcw, Search, Skull, Target, FileText, Download, Copy, Share2, Users, Sword, Flag, Timer, Biohazard, Brush, Hammer, Package, Trophy, BookOpen, Percent, Edit3, FolderOpen, Disc, Wrench, ChevronDown, ChevronUp, ShoppingBag } from 'lucide-react';

// --- ERROR BOUNDARY ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("App Crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#450a0a', color: 'white', minHeight: '100vh', fontFamily: 'sans-serif' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>Nurgle's Rot Detected (App Crash)</h2>
          <p>Something went wrong rendering the Army Builder.</p>
          <button 
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            style={{ padding: '10px 20px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Purge Data & Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- DATA: PAINTING STATUS ---
const PAINT_STATUS = {
  pile: { label: 'Pile of Shame', icon: Package, color: 'text-slate-500', border: 'border-slate-700' },
  built: { label: 'Built', icon: Hammer, color: 'text-slate-300', border: 'border-slate-500' },
  primed: { label: 'Primed', icon: Circle, color: 'text-slate-400', border: 'border-slate-400' },
  painted: { label: 'Battle Ready', icon: Brush, color: 'text-green-500', border: 'border-green-500' },
  parade: { label: 'Parade Ready', icon: Trophy, color: 'text-yellow-500', border: 'border-yellow-500' },
};

// --- DATA: PLAGUES (SPREAD THE SICKNESS) ---
const SICKNESSES = [
  { id: 'skullsquirm', name: 'Skullsquirm Blight', effect: 'Worsen BS and WS by 1.' },
  { id: 'rattlejoint', name: 'Rattlejoint Ague', effect: 'Worsen Save characteristic by 1.' },
  { id: 'scabrous', name: 'Scabrous Soulrot', effect: 'Worsen Leadership and OC by 1.' },
  { id: 'poxes_bonus', name: 'Lord of Poxes (Unit Only)', effect: 'Worsen Save & -1 to Hit (Specific Unit Only).' }
];

// --- DATA: DETACHMENTS & STRATAGEMS ---
const DETACHMENTS = [
  { 
    id: 'plague_company', 
    name: 'Plague Company (Index)', 
    desc: 'The standard vector. Spreads Contagion to objectives. Good for sticky objective play.', 
    criteria: (units) => true, 
    score: 0,
    stratagems: [
      { name: 'Ferric Blight', cp: 1, phase: 'Shooting/Fight', desc: 'Improve AP by 1 for weapons with Lethal Hits. Critical for punching through armor.' },
      { name: 'Sanguous Flux', cp: 1, phase: 'Fight', desc: 'Weapons gain [Sustained Hits 1]. If in range of infected objective, gain [Sustained Hits 2].' },
      { name: 'Cloud of Flies', cp: 1, phase: 'Opponent Shooting', desc: 'Target unit gains Stealth (-1 to be hit). Essential defensive tool.' },
      { name: 'Boilblight', cp: 1, phase: 'Shooting', desc: 'Weapons gain [Heavy] and [Ignores Cover]. Spotter unit must see target.' },
    ]
  },
  { 
    id: 'inexorable', 
    name: 'The Inexorable', 
    desc: 'Armor penetration mitigation and vehicle movement. Best for Rhino/Land Raider heavy lists.', 
    criteria: (units) => units.filter(u => u.role === 'Dedicated Transport' || u.name.includes('Land Raider') || u.name.includes('Predator')).length >= 2, 
    score: 0,
    stratagems: [
      { name: 'Ferric Blight', cp: 1, phase: 'Shooting/Fight', desc: 'Improve AP by 1 for weapons with Lethal Hits.' },
      { name: 'Leech-Spore Casket', cp: 1, phase: 'Shooting', desc: 'When a vehicle destroys a model, heal D3 wounds on a nearby unit.' },
      { name: 'Unholy Advance', cp: 1, phase: 'Movement', desc: 'Vehicles can shoot as if they remained stationary after Falling Back.' },
      { name: 'Cloud of Flies', cp: 1, phase: 'Opponent Shooting', desc: 'Target unit gains Stealth (-1 to be hit).' },
    ]
  },
  { 
    id: 'mortarions_anvil', 
    name: 'Mortarion\'s Anvil', 
    desc: 'Defensive melee. Heroic intervention and bodyguard bonuses. Best for Terminator bricks/Characters.', 
    criteria: (units) => units.filter(u => u.name.includes('Deathshroud') || u.name.includes('Blightlord') || u.role === 'Character').length >= 3, 
    score: 0,
    stratagems: [
      { name: 'Gloaming Bloat', cp: 1, phase: 'Fight', desc: 'Shut down enemy re-rolls to hit and wound against this unit.' },
      { name: 'Relentless', cp: 2, phase: 'Fight', desc: 'Character fights on death.' },
      { name: 'Face of the Mantle', cp: 1, phase: 'Charge', desc: 'Heroic Intervention costs 0CP and unit hits on 2+.' },
      { name: 'Sanguous Flux', cp: 1, phase: 'Fight', desc: 'Weapons gain [Sustained Hits 1].' },
    ]
  },
  { 
    id: 'ferrymen', 
    name: 'The Ferrymen', 
    desc: 'Drone and Poxwalker support. Enhances aura ranges and morale debuffs.', 
    criteria: (units) => units.filter(u => u.name.includes('Bloat-drone') || u.name.includes('Poxwalker') || u.name.includes('Blightlord')).length >= 3, 
    score: 0,
    stratagems: [
      { name: 'The Droning', cp: 1, phase: 'Movement', desc: 'Halve Move characteristic of enemy units within Contagion Range.' },
      { name: 'On Droning Wings', cp: 1, phase: 'Command', desc: 'Add 6" to aura abilities of one Character.' },
      { name: 'Cloud of Flies', cp: 1, phase: 'Opponent Shooting', desc: 'Target unit gains Stealth (-1 to be hit).' },
      { name: 'Vermid Whispers', cp: 1, phase: 'Shooting', desc: '+1 to Hit for Poxwalkers or Blightlords.' },
    ]
  },
  { 
    id: 'wretched', 
    name: 'The Wretched', 
    desc: 'Psyker heavy. Mortal wound output maximized. Requires Psykers.', 
    criteria: (units) => units.filter(u => (u.synergy || '').includes('psyker') || u.name.includes('Malignant')).length >= 2, 
    score: 0,
    stratagems: [
      { name: 'Eater of Magic', cp: 1, phase: 'Psychic', desc: 'Psychic attacks gain [Devastating Wounds].' },
      { name: 'Sevenfold Blessings', cp: 1, phase: 'Command', desc: 'Psyker can re-roll psychic test. If 7+ rolled, refund CP.' },
      { name: 'Putrid Explosion', cp: 1, phase: 'Fight', desc: 'If Psyker dies, they explode dealing D3 mortals to everyone within 6".' },
      { name: 'Boilblight', cp: 1, phase: 'Shooting', desc: 'Weapons gain [Heavy] and [Ignores Cover].' },
    ]
  },
  { 
    id: 'poxmongers', 
    name: 'Poxmongers', 
    desc: 'Daemon Engine focus. Improves invulnerable saves for Engines. Great for Haulers and Crawlers.', 
    criteria: (units) => units.filter(u => (u.synergy || '').includes('daemon_engine') || u.role === 'Vehicle' || u.name.includes('War Dog')).length >= 3, 
    score: 0,
    stratagems: [
      { name: 'Ironclot Furnace', cp: 1, phase: 'Command', desc: 'Daemon Engines gain 4+ Invulnerable Save.' },
      { name: 'Bilious Blood-rush', cp: 1, phase: 'Shooting', desc: 'Daemon Engines can shoot after Falling Back.' },
      { name: 'Boilblight', cp: 1, phase: 'Shooting', desc: 'Weapons gain [Heavy] and [Ignores Cover].' },
      { name: 'Ferric Blight', cp: 1, phase: 'Shooting/Fight', desc: 'Improve AP by 1 for weapons with Lethal Hits.' },
    ]
  },
  { 
    id: 'chosen_sons', 
    name: 'The Chosen Sons', 
    desc: 'Flamer and Plague Belcher specialists. Increases strength of torrent weapons.', 
    criteria: (units) => units.filter(u => (u.synergy || '').includes('torrent') || (u.synergy || '').includes('flamer') || u.name.includes('Deathshroud')).length >= 3, 
    score: 0,
    stratagems: [
      { name: 'Plague Brewer', cp: 1, phase: 'Shooting', desc: 'Add 1 to Damage of Torrent weapons (Flamers/Belchers).' },
      { name: 'Cloud of Flies', cp: 1, phase: 'Opponent Shooting', desc: 'Target unit gains Stealth (-1 to be hit).' },
      { name: 'Sanguous Flux', cp: 1, phase: 'Fight', desc: 'Weapons gain [Sustained Hits 1].' },
      { name: 'Comfort in Coruption', cp: 2, phase: 'Charge', desc: '-2 to Charge rolls made against this unit.' },
    ]
  },
  { 
    id: 'terminus_est', 
    name: 'Terminus Est Assault', 
    desc: 'Infantry & Poxwalker horde. Grants Deep Strike to Bubotic Astartes. No Vehicles allowed.', 
    criteria: (units) => units.filter(u => u.role === 'Battleline' || u.name.includes('Poxwalker') || u.name.includes('Terminator')).length >= 4 && units.filter(u => u.role === 'Vehicle' && !u.name.includes('War Dog')).length === 0, 
    score: 0,
    stratagems: [
      { name: 'Rotting Tide', cp: 1, phase: 'Command', desc: 'Return D3+3 destroyed Poxwalkers to a unit.' },
      { name: 'Outbreak Assault', cp: 1, phase: 'Movement', desc: 'Unit arriving from Deep Strike adds 1 to Charge rolls.' },
      { name: 'Mutant Strain', cp: 1, phase: 'Fight', desc: 'Poxwalkers deal mortals on 6s to hit, but take mortals on 1s.' },
      { name: 'Sanguous Flux', cp: 1, phase: 'Fight', desc: 'Weapons gain [Sustained Hits 1].' },
    ]
  },
];

const OPPONENTS = [
  { id: 'none', name: 'Standard / Balanced', label: 'Balanced Opponent', priority: [] },
  { id: 'horde', name: 'Horde (Orks, Nids, Guard)', label: 'Swarm Army', priority: ['blast', 'flamer', 'horde_clear', 'torrent', 'anti_infantry'] },
  { id: 'elite', name: 'Elite Infantry (Custodes, TEQ)', label: 'Elite Infantry', priority: ['anti_elite', 'mortal', 'lethal_hits', 'high_ap'] },
  { id: 'vehicle', name: 'Monster / Vehicle (Knights)', label: 'Heavy Armor', priority: ['anti_tank', 'lethal_hits', 'melta', 'entropy', 'lascannon'] },
  { id: 'psyker', name: 'Psychic Heavy (Thousand Sons)', label: 'Psychic Heavy', priority: ['anti_psyker', 'fnp_mortal'] },
  { id: 'melee', name: 'Melee Rush (World Eaters)', label: 'Melee Rush', priority: ['fights_first', 'fight_on_death', 'foul_blightspawn', 'flamer', 'screen'] },
];

// --- DEATH GUARD DATABASE (META-TUNED 10th ED) ---
const UNIT_DATABASE = [
  // --- EPIC HEROES ---
  { id: 'epic_morty', name: 'Mortarion', basePoints: 325, role: 'Epic Hero', unique: true, synergy: 'lord_of_war fly psyker anti_tank horde_clear monster meta_centerpiece', sizes: [1] },
  { id: 'epic_typhus', name: 'Typhus', basePoints: 80, role: 'Epic Hero', unique: true, synergy: 'psyker mortal horde_clear buff_poxwalkers deep_strike meta_staple', sizes: [1], leads: ['el_ds', 'el_bl', 'tr_pox'] }, // FIXED LEADER PRIORITY
  
  // --- CHARACTERS ---
  { id: 'hq_lord_poxes', name: 'Lord of Poxes', basePoints: 75, role: 'Character', unique: false, synergy: 'stealth contagion_buff anti_infantry lone_operative meta_new', sizes: [1], leads: ['tr_pm'] },
  { id: 'hq_lord', name: 'Death Guard Chaos Lord', basePoints: 65, role: 'Character', unique: false, synergy: 'reroll_1s aura cheap_hq', sizes: [1], leads: ['tr_pm'] },
  { id: 'hq_lord_term', name: 'DG Chaos Lord in Terminator Armour', basePoints: 85, role: 'Character', unique: false, synergy: 'terminator_armor mortal_aura deep_strike', sizes: [1], leads: ['el_bl', 'el_ds'] },
  { id: 'hq_sorc', name: 'DG Sorcerer in Power Armour', basePoints: 60, role: 'Character', unique: false, synergy: 'psyker -1_to_hit debuff', sizes: [1], leads: ['tr_pm'] },
  { id: 'hq_sorc_term', name: 'DG Sorcerer in Terminator Armour', basePoints: 70, role: 'Character', unique: false, synergy: 'psyker terminator_armor -1_dmg', sizes: [1], leads: ['el_bl', 'el_ds'] },
  { id: 'hq_lov', name: 'Lord of Virulence', basePoints: 80, role: 'Character', unique: false, synergy: 'buff_blast anti_infantry terminator_armor meta_staple', sizes: [1], leads: ['el_bl', 'el_ds'] }, // Good with PBCs
  { id: 'hq_loc', name: 'Lord of Contagion', basePoints: 80, role: 'Character', unique: false, synergy: 'melee_beatstick terminator_armor reroll_hits', sizes: [1], leads: ['el_ds', 'el_bl'] },
  { id: 'hq_dp', name: 'Death Guard Daemon Prince', basePoints: 160, role: 'Character', unique: false, synergy: 'monster melee invuln fnp_aura', sizes: [1] },
  { id: 'hq_dp_wings', name: 'DG Daemon Prince with Wings', basePoints: 195, role: 'Character', unique: false, synergy: 'monster melee fly fast', sizes: [1] },
  { id: 'hq_malignant', name: 'Malignant Plaguecaster', basePoints: 65, role: 'Character', unique: false, synergy: 'psyker mortal -1_to_wound', sizes: [1], leads: ['tr_pm'] },
  
  // --- VIRION ---
  { id: 'vir_foul', name: 'Foul Blightspawn', basePoints: 50, role: 'Character', unique: false, synergy: 'fights_first anti_charge torrent flamer meta_staple', sizes: [1], leads: ['tr_pm'], isVirion: true },
  { id: 'vir_bio', name: 'Biologus Putrifier', basePoints: 50, role: 'Character', unique: false, synergy: 'lethal_hits_buff crit_5+ grenade meta_staple', sizes: [1], leads: ['tr_pm'], isVirion: true },
  { id: 'vir_tally', name: 'Tallyman', basePoints: 45, role: 'Character', unique: false, synergy: 'cp_generation +1_to_hit meta_staple', sizes: [1], leads: ['tr_pm'], isVirion: true },
  { id: 'vir_surgeon', name: 'Plague Surgeon', basePoints: 65, role: 'Character', unique: false, synergy: 'heal resurrect fnp_buff', sizes: [1], leads: ['tr_pm'], isVirion: true },
  { id: 'vir_icon', name: 'Noxious Blightbringer', basePoints: 50, role: 'Character', unique: false, synergy: 'move_buff battleshock', sizes: [1], leads: ['tr_pm'], isVirion: true },

  // --- BATTLELINE ---
  { 
      id: 'tr_pm', 
      name: 'Plague Marines', 
      basePoints: 90, 
      role: 'Battleline', 
      unique: false, 
      synergy: 'sticky_obj special_weapons lethal_hits meta_core', 
      sizes: [5, 10],
      wargearProfiles: [
          { name: 'Heavy Melee', desc: 'Heavy Plague Weapons / Bubotic', tags: 'melee' },
          { name: 'Special Guns', desc: 'Plasma / Melta / Blight Launchers', tags: 'anti_elite anti_tank mid_range' },
          { name: 'Torrent/Spewers', desc: 'Plague Spewers / Belchers', tags: 'torrent overwatch' },
          { name: 'Standard Bolters', desc: 'Boltgun / Plague Knives', tags: 'mid_range' }
      ]
  },
  { id: 'tr_cult', name: 'Death Guard Cultists', basePoints: 50, role: 'Battleline', unique: false, synergy: 'scout screen cheap secondary_scoring', sizes: [10, 20] },
  { id: 'tr_pox', name: 'Poxwalkers', basePoints: 50, role: 'Battleline', unique: false, synergy: 'screen fnp horde regenerate', sizes: [10, 20] },

  // --- INFANTRY ---
  { id: 'el_ds', name: 'Deathshroud Terminators', basePoints: 120, role: 'Infantry', unique: false, synergy: 'flamer torrent melee bodyguard terminator_armor deep_strike meta_hammer', sizes: [3, 6] },
  { 
      id: 'el_bl', 
      name: 'Blightlord Terminators', 
      basePoints: 165, 
      role: 'Infantry', 
      unique: false, 
      synergy: 'durable deep_strike terminator_armor lethal_hits', 
      sizes: [5, 10],
      wargearProfiles: [
          { name: 'Combi-Bolters', desc: 'Standard', tags: 'mid_range' },
          { name: 'Anti-Infantry', desc: 'Combi-Weapons / Reaper', tags: 'anti_infantry' },
          { name: 'Anti-Tank', desc: 'Melta / Missile', tags: 'anti_tank melta' }
      ]
  },
  { id: 'el_spawn', name: 'Death Guard Chaos Spawn', basePoints: 70, role: 'Infantry', unique: false, synergy: 'fast regenerate cheap melee', sizes: [2] },

  // --- VEHICLES ---
  { id: 'fa_drone_fleshmower', name: 'Foetid Bloat-drone (Fleshmower)', basePoints: 90, role: 'Vehicle', unique: false, synergy: 'daemon_engine fly melee anti_infantry', sizes: [1] },
  { id: 'fa_drone_spitter', name: 'Foetid Bloat-drone (Plaguespitters)', basePoints: 90, role: 'Vehicle', unique: false, synergy: 'daemon_engine fly torrent flamer overwatch', sizes: [1] },
  { id: 'fa_drone_launcher', name: 'Foetid Bloat-drone (Heavy Blight Launcher)', basePoints: 90, role: 'Vehicle', unique: false, synergy: 'daemon_engine fly shoot', sizes: [1] },
  { id: 'fa_mbh', name: 'Myphitic Blight-hauler', basePoints: 100, role: 'Vehicle', unique: false, synergy: 'daemon_engine anti_tank melta fast', sizes: [1, 2, 3] },
  { 
      id: 'hs_pbc', 
      name: 'Plagueburst Crawler', 
      basePoints: 180, 
      role: 'Vehicle', 
      unique: false, 
      synergy: 'daemon_engine indirect mortar anti_infantry durable entropy meta_artillery', 
      sizes: [1],
      wargearProfiles: [
          { name: 'Entropy Cannons', desc: 'Anti-Tank', tags: 'anti_tank lascannon' },
          { name: 'Plaguespitters', desc: 'Overwatch/Anti-Infantry', tags: 'torrent overwatch' },
          { name: 'Rothail', desc: 'Rapid Fire', tags: 'mid_range' }
      ]
  },
  { id: 'hs_defiler', name: 'Death Guard Defiler', basePoints: 190, role: 'Vehicle', unique: false, synergy: 'daemon_engine hybrid walker scourge', sizes: [1] },
  { 
      id: 'el_helbrute', 
      name: 'Death Guard Helbrute', 
      basePoints: 140, 
      role: 'Vehicle', 
      unique: false, 
      synergy: 'contagion_buff walker', 
      sizes: [1],
      wargearProfiles: [
          { name: 'Range Focus', desc: 'Missile/Lascannon', tags: 'anti_tank long_range' },
          { name: 'Hybrid', desc: 'Melee/Melta', tags: 'melee melta' },
          { name: 'Melee Focus', desc: 'Double Fists', tags: 'melee' }
      ]
  },
  { id: 'hs_pred_ann', name: 'DG Predator Annihilator', basePoints: 130, role: 'Vehicle', unique: false, synergy: 'anti_tank lascannon', sizes: [1] },
  { id: 'hs_pred_des', name: 'DG Predator Destructor', basePoints: 130, role: 'Vehicle', unique: false, synergy: 'anti_elite autocannon', sizes: [1] },
  { id: 'hs_lr', name: 'Death Guard Land Raider', basePoints: 240, role: 'Vehicle', unique: false, synergy: 'transport assault_ramp lascannon durable', sizes: [1] },

  // --- OTHERS ---
  { id: 'dt_rhino', name: 'Death Guard Rhino', basePoints: 75, role: 'Dedicated Transport', unique: false, synergy: 'transport firing_deck self_repair meta_transport', sizes: [1] },
  { id: 'fort_miasmic', name: 'Miasmic Malignifier', basePoints: 65, role: 'Fortification', unique: false, synergy: 'contagion_spread cover infiltrate', sizes: [1] },

  // --- ALLIES ---
  { id: 'ally_guo', name: 'Great Unclean One (Ally)', basePoints: 230, role: 'Ally', unique: true, synergy: 'monster psyker fnp res', sizes: [1] },
  { id: 'ally_rotigus', name: 'Rotigus (Ally)', basePoints: 230, role: 'Ally', unique: true, synergy: 'monster psyker mortal', sizes: [1] },
  { id: 'ally_poxbringer', name: 'Poxbringer (Ally)', basePoints: 55, role: 'Ally', unique: false, synergy: 'psyker buff_daemon', sizes: [1] },
  { id: 'ally_scrivener', name: 'Spoilpox Scrivener (Ally)', basePoints: 60, role: 'Ally', unique: false, synergy: 'buff_plaguebearers', sizes: [1] },
  { id: 'ally_bilepiper', name: 'Sloppity Bilepiper (Ally)', basePoints: 55, role: 'Ally', unique: false, synergy: 'buff_nurgling battleshock', sizes: [1] },
  { id: 'ally_nurgling', name: 'Nurglings (Ally)', basePoints: 40, role: 'Ally', unique: false, synergy: 'infiltrate screen cheap -1_to_hit secondary_scoring', sizes: [3, 6, 9] },
  { id: 'ally_plaguebearers', name: 'Plaguebearers (Ally)', basePoints: 110, role: 'Ally', unique: false, synergy: 'sticky_obj screen deep_strike', sizes: [10] },
  { id: 'ally_beast', name: 'Beast of Nurgle (Ally)', basePoints: 70, role: 'Ally', unique: false, synergy: 'durable deep_strike regenerate', sizes: [1, 2] },
  { id: 'ally_drones', name: 'Plague Drones (Ally)', basePoints: 110, role: 'Ally', unique: false, synergy: 'fly fast melee', sizes: [3, 6] },
  { id: 'ally_wardog_brig', name: 'War Dog Brigand (Ally)', basePoints: 170, role: 'Ally', unique: false, synergy: 'vehicle walker shooting melta meta_ally', sizes: [1] },
  { id: 'ally_wardog_karn', name: 'War Dog Karnivore (Ally)', basePoints: 140, role: 'Ally', unique: false, synergy: 'vehicle walker melee fast', sizes: [1] },
  { id: 'ally_wardog_stalk', name: 'War Dog Stalker (Ally)', basePoints: 150, role: 'Ally', unique: false, synergy: 'vehicle walker hybrid character_sniper', sizes: [1] },
  { id: 'ally_wardog_exec', name: 'War Dog Executioner (Ally)', basePoints: 150, role: 'Ally', unique: false, synergy: 'vehicle walker long_range autocannon', sizes: [1] },
  { id: 'ally_wardog_hunt', name: 'War Dog Huntsman (Ally)', basePoints: 150, role: 'Ally', unique: false, synergy: 'vehicle walker anti_tank melta', sizes: [1] },
];

function AppContent() {
  const [activeTab, setActiveTab] = useState('inventory');
  const [inventory, setInventory] = useState([]);
  const [currentList, setCurrentList] = useState([]);
  const [dreamList, setDreamList] = useState([]); // New state for wishlist
  const [targetPoints, setTargetPoints] = useState(2000);
  const [notification, setNotification] = useState(null);
  const [sortMethod, setSortMethod] = useState('role'); 
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [opponent, setOpponent] = useState('none');
  const [suggestedDetachment, setSuggestedDetachment] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [appError, setAppError] = useState(null);

  // --- FEATURE STATES ---
  const [prioritizePainted, setPrioritizePainted] = useState(false);
  const [editingPointsId, setEditingPointsId] = useState(null); 
  const [tempPoints, setTempPoints] = useState(0); 
  const [listName, setListName] = useState("My Death Guard Army");
  const [savedLists, setSavedLists] = useState([]);
  
  // New State for Wargear Configurator
  const [expandedWargearId, setExpandedWargearId] = useState(null); // ID of unit currently configuring

  // --- BATTLE MODE STATE ---
  const [gameTurn, setGameTurn] = useState(1);
  const [selectedSickness, setSelectedSickness] = useState(SICKNESSES[0].id);
  const [scores, setScores] = useState({ cpMe: 0, cpOpp: 0, vpMe: 0, vpOpp: 0 });
  const [objectives, setObjectives] = useState({
    alpha: false, beta: false, gamma: false, delta: false, epsilon: false, zeta: false
  });
  
  const [mathStr, setMathStr] = useState(4);
  const [mathTough, setMathTough] = useState(4);

  // --- LOAD DATA ---
  useEffect(() => {
    try {
      const savedInv = localStorage.getItem('mm_dg_inventory_v3');
      if (savedInv) setInventory(JSON.parse(savedInv));
      
      const savedPlans = localStorage.getItem('mm_dg_plans');
      if (savedPlans) setSavedLists(JSON.parse(savedPlans));
    } catch (e) {
      console.warn("Storage Load Warning:", e);
    }
    setIsLoaded(true);
  }, []);

  // --- SAVE DATA ---
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('mm_dg_inventory_v3', JSON.stringify(inventory));
        localStorage.setItem('mm_dg_plans', JSON.stringify(savedLists));
      } catch (e) {
        console.warn("Storage Save Warning:", e);
      }
    }
  }, [inventory, savedLists, isLoaded]);

  // --- INVENTORY ACTIONS ---
  const addToInventory = (unit) => {
    try {
        const newUnit = {
          uuid: Math.random().toString(36).substr(2, 9),
          unitId: unit.id,
          name: unit.name,
          role: unit.role,
          synergy: unit.synergy || '',
          unique: unit.unique,
          modelCount: unit.sizes ? unit.sizes[0] : 1, 
          points: unit.basePoints,
          status: 'pile',
          activeWargear: [] // Array of wargear profile names
        };
        setInventory(prev => [newUnit, ...prev]);
        showNotification(`Added ${unit.name}`);
    } catch (err) {
        setAppError("Error adding unit: " + err.message);
    }
  };

  const removeFromInventory = (uuid) => {
    setInventory(prev => prev.filter(u => u.uuid !== uuid));
  };

  const updateUnitStatus = (uuid, newStatus) => {
    setInventory(prev => prev.map(u => {
        if (u.uuid !== uuid) return u;
        return { ...u, status: newStatus };
    }));
  };

  // --- WARGEAR TOGGLE LOGIC ---
  const toggleWargear = (uuid, profileName) => {
      setInventory(prev => prev.map(u => {
          if (u.uuid !== uuid) return u;
          const current = u.activeWargear || [];
          const exists = current.includes(profileName);
          
          let newWargear;
          if (exists) {
              newWargear = current.filter(p => p !== profileName);
          } else {
              newWargear = [...current, profileName];
          }
          return { ...u, activeWargear: newWargear };
      }));
  };

  const startEditingPoints = (unit) => {
      setEditingPointsId(unit.uuid);
      setTempPoints(unit.points);
  };

  const savePoints = (uuid) => {
      setInventory(prev => prev.map(u => {
          if (u.uuid !== uuid) return u;
          return { ...u, points: tempPoints };
      }));
      setEditingPointsId(null);
  };

  const updateUnitSize = (uuid, newSize) => {
    setInventory(prev => prev.map(u => {
      if (u.uuid !== uuid) return u;
      const dbUnit = UNIT_DATABASE.find(db => db.id === u.unitId);
      if (!dbUnit) return u; 
      let calculatedPoints = dbUnit.basePoints;
      if (dbUnit.sizes && dbUnit.sizes.length > 1) {
          if (newSize > dbUnit.sizes[0]) calculatedPoints = dbUnit.basePoints * 2;
          if (['fa_mbh', 'ally_nurgling', 'ally_drones', 'ally_beast'].includes(dbUnit.id)) {
             if(dbUnit.id === 'ally_nurgling') calculatedPoints = 40 * (newSize/3);
             else if(dbUnit.id === 'fa_mbh') calculatedPoints = 100 * newSize;
             else if(dbUnit.id === 'ally_drones') calculatedPoints = 110 * (newSize/3);
             else if(dbUnit.id === 'ally_beast') calculatedPoints = 70 * newSize;
             else calculatedPoints = (dbUnit.basePoints / dbUnit.sizes[0]) * newSize;
          }
      }
      return { ...u, modelCount: newSize, points: Math.round(calculatedPoints) || 0 };
    }));
  };

  const clearList = () => {
    setCurrentList([]);
    setSuggestedDetachment(null);
    setListName("New Army List");
  };

  const resetData = () => {
    if (confirm("Are you sure you want to delete your entire inventory?")) {
      setInventory([]);
      try { localStorage.removeItem('mm_dg_inventory_v3'); } catch(e) {}
      showNotification("Inventory cleared", "error");
    }
  };

  const saveCurrentList = () => {
      if (currentList.length === 0) {
          showNotification("Cannot save empty list", "error");
          return;
      }
      const newPlan = {
          id: Date.now(),
          name: listName,
          units: currentList,
          detachment: suggestedDetachment,
          targetPoints: targetPoints,
          opponent: opponent
      };
      setSavedLists(prev => [...prev, newPlan]);
      showNotification("Battle Plan Saved!");
  };

  const loadList = (plan) => {
      setCurrentList(plan.units);
      setSuggestedDetachment(plan.detachment);
      setTargetPoints(plan.targetPoints || 2000);
      setOpponent(plan.opponent || 'none');
      setListName(plan.name);
      showNotification(`Loaded "${plan.name}"`);
  };

  const deleteList = (id) => {
      setSavedLists(prev => prev.filter(p => p.id !== id));
  };

  // --- SQUAD ORGANIZATION LOGIC ---
  const organizeArmy = (rawList) => {
    let unassignedUnits = JSON.parse(JSON.stringify(rawList));
    let squads = [];
    const characters = unassignedUnits.filter(u => u.role === 'Character' || u.role === 'Epic Hero');
    const bodies = unassignedUnits.filter(u => u.role !== 'Character' && u.role !== 'Epic Hero');
    let squadMap = bodies.map(b => ({ body: b, leaders: [] }));
    let attachedCharUUIDs = new Set();

    characters.forEach(char => {
        const dbChar = UNIT_DATABASE.find(db => db.id === char.unitId);
        if (!dbChar || !dbChar.leads) return; 
        const bestBodyguardIndex = squadMap.findIndex(s => {
            const dbBody = UNIT_DATABASE.find(db => db.id === s.body.unitId);
            if (!dbBody) return false;
            if (!dbChar.leads.includes(dbBody.id)) return false;
            if (dbBody.id === 'tr_pm') {
                if (s.leaders.length >= 2) return false;
                if (s.leaders.length === 1) return true;
                return true;
            } else {
                return s.leaders.length === 0;
            }
        });
        if (bestBodyguardIndex !== -1) {
            squadMap[bestBodyguardIndex].leaders.push(char);
            attachedCharUUIDs.add(char.uuid);
        }
    });

    squadMap.forEach(s => {
        if (s.leaders.length > 0) squads.push({ type: 'squad', body: s.body, leaders: s.leaders });
        else squads.push({ type: 'single', unit: s.body });
    });
    characters.forEach(char => {
        if (!attachedCharUUIDs.has(char.uuid)) squads.push({ type: 'single', unit: char });
    });
    return squads;
  };

  const safeGetUtility = (u, opp) => {
    let score = u.points || 0;
    const oppData = OPPONENTS.find(o => o.id === opp);
    const dbUnit = UNIT_DATABASE.find(db => db.id === u.unitId);
    
    // --- NEW LOGIC: MERGE SYNERGIES ---
    let fullSynergy = u.synergy || '';
    
    // Append active wargear synergies
    if (dbUnit && dbUnit.wargearProfiles && u.activeWargear) {
        u.activeWargear.forEach(profileName => {
            const profile = dbUnit.wargearProfiles.find(p => p.name === profileName);
            if (profile) fullSynergy += ' ' + profile.tags;
        });
    }

    if (oppData && oppData.priority.length > 0) {
        if (oppData.priority.some(tag => fullSynergy.includes(tag))) score *= 1.5;
    }
    
    // --- META BIAS ---
    if (fullSynergy.includes('meta_staple')) score *= 1.25;
    if (fullSynergy.includes('meta_core')) score *= 1.2;
    if (fullSynergy.includes('meta_hammer')) score *= 1.15;
    if (fullSynergy.includes('secondary_scoring')) score *= 1.15;
    if (fullSynergy.includes('meta_artillery')) score *= 1.15;
    if (fullSynergy.includes('meta_ally')) score *= 1.15;

    return score;
  };

  // --- ACQUISITION LOGIC ---
  const generateDreamList = () => {
    try {
        let newList = [];
        let currentPoints = 0;
        
        let pool = [];

        // Add owned units
        inventory.forEach(invUnit => {
            pool.push({ ...invUnit, isOwned: true });
        });

        // Add potential new units (up to 3/6 limit) from DB
        UNIT_DATABASE.forEach(dbUnit => {
            const limit = (dbUnit.role === 'Battleline' || dbUnit.role === 'Dedicated Transport') ? 6 : 3;
            const uniqueLimit = dbUnit.unique ? 1 : limit;
            
            const ownedCount = inventory.filter(u => u.unitId === dbUnit.id).length;
            const remainingSlots = Math.max(0, uniqueLimit - ownedCount);

            for(let i=0; i < remainingSlots; i++) {
                pool.push({
                    ...dbUnit,
                    unitId: dbUnit.id,
                    uuid: `dream-${dbUnit.id}-${i}`,
                    modelCount: dbUnit.sizes[0], // default min size
                    points: dbUnit.basePoints,
                    isOwned: false,
                    activeWargear: [] // Default wargear
                });
            }
        });

        // --- SELECTION LOGIC (Similar to generateSmartList but simpler) ---

        // 1. Mandatory Warlord
        const characters = pool.filter(u => u.role === 'Character' || u.role === 'Epic Hero');
        if (characters.length > 0) {
            characters.sort((a,b) => {
                let scoreA = safeGetUtility(a, opponent);
                let scoreB = safeGetUtility(b, opponent);
                if (a.isOwned) scoreA *= 1.2; // Slight bias to what you own
                if (b.isOwned) scoreB *= 1.2;
                return scoreB - scoreA;
            });
            
            const warlord = characters[0];
            newList.push(warlord);
            currentPoints += warlord.points;
            
            // Remove from pool
            const idx = pool.findIndex(u => u.uuid === warlord.uuid);
            if (idx > -1) pool.splice(idx, 1);
        }

        // 2. Battleline (Try for 2)
        const battleline = pool.filter(u => u.role === 'Battleline');
        for(let i=0; i<2; i++) {
            if (battleline[i] && currentPoints + battleline[i].points <= targetPoints) {
                newList.push(battleline[i]);
                currentPoints += battleline[i].points;
                const idx = pool.findIndex(u => u.uuid === battleline[i].uuid);
                if (idx > -1) pool.splice(idx, 1);
            }
        }

        // 3. Fill Remainder
        pool.sort((a,b) => {
            let scoreA = safeGetUtility(a, opponent);
            let scoreB = safeGetUtility(b, opponent);
            
            // --- NEW: LAND RAIDER BIAS FIX ---
            // If it's a vehicle (and not a cheap ally/transport) and opponent isn't vehicles
            if (a.role === 'Vehicle' && opponent !== 'vehicle') scoreA *= 0.7; // Reduce desirability
            if (b.role === 'Vehicle' && opponent !== 'vehicle') scoreB *= 0.7;

            if (a.isOwned) scoreA *= 1.2; 
            if (b.isOwned) scoreB *= 1.2;
            return scoreB - scoreA;
        });

        for (const unit of pool) {
            // Rule of 3/6 checks
            if (unit.unique && newList.some(u => u.unitId === unit.unitId)) continue;
            const currentCount = newList.filter(u => u.unitId === unit.unitId).length;
            const isExempt = unit.role === 'Battleline' || unit.role === 'Dedicated Transport' || unit.role === 'Ally'; 
            if (!isExempt && currentCount >= 3) continue;
            if (isExempt && currentCount >= 6) continue;
            
            // Character Cap
            const isChar = unit.role === 'Character' || unit.role === 'Epic Hero';
            const charCount = newList.filter(u => u.role === 'Character' || u.role === 'Epic Hero').length;
            if (isChar && charCount >= 5 && targetPoints <= 2000) continue; 

            if (currentPoints + unit.points <= targetPoints) {
                newList.push(unit);
                currentPoints += unit.points;
            }
        }

        setDreamList(newList);
        showNotification("Acquisition List Generated!");

    } catch (err) {
        setAppError("Dream Builder failed: " + err.message);
    }
  };

  const generateSmartList = () => {
    try {
        let availableInventory = JSON.parse(JSON.stringify(inventory)); 
        let newList = [];
        let currentPoints = 0;
        
        if (prioritizePainted) {
            availableInventory.sort((a,b) => {
                const isPaintedA = ['painted', 'parade'].includes(a.status || 'pile');
                const isPaintedB = ['painted', 'parade'].includes(b.status || 'pile');
                return (isPaintedB === true) - (isPaintedA === true);
            });
        }

        const characters = availableInventory.filter(u => u.role === 'Character' || u.role === 'Epic Hero');
        if (characters.length === 0) {
          showNotification("Error: You need at least 1 Character!", "error");
          return;
        }
        
        characters.sort((a,b) => {
            const aScore = (a.role === 'Epic Hero' ? 1000 : 0) + (a.points || 0);
            const bScore = (b.role === 'Epic Hero' ? 1000 : 0) + (b.points || 0);
            return bScore - aScore;
        });
        
        const warlord = characters[0];
        newList.push(warlord);
        const warlordIndex = availableInventory.findIndex(u => u.uuid === warlord.uuid);
        if (warlordIndex > -1) availableInventory.splice(warlordIndex, 1);
        currentPoints += warlord.points;

        const battleline = availableInventory.filter(u => u.role === 'Battleline');
        for(let i=0; i<3; i++) { 
            if(battleline[i] && currentPoints + battleline[i].points <= targetPoints) {
                newList.push(battleline[i]);
                const idx = availableInventory.findIndex(u => u.uuid === battleline[i].uuid);
                if (idx > -1) availableInventory.splice(idx, 1);
                currentPoints += battleline[i].points;
            }
        }

        const safeGetUtility = (u, opp) => {
             let score = u.points || 0;
             const oppData = OPPONENTS.find(o => o.id === opp);
             const dbUnit = UNIT_DATABASE.find(db => db.id === u.unitId);
             
             // --- NEW LOGIC: MERGE SYNERGIES ---
             let fullSynergy = u.synergy || '';
             
             // Append active wargear synergies
             if (dbUnit && dbUnit.wargearProfiles && u.activeWargear) {
                 u.activeWargear.forEach(profileName => {
                     const profile = dbUnit.wargearProfiles.find(p => p.name === profileName);
                     if (profile) fullSynergy += ' ' + profile.tags;
                 });
             }

             if (oppData && oppData.priority.length > 0) {
                 if (oppData.priority.some(tag => fullSynergy.includes(tag))) score *= 1.5;
             }
             
             // --- META BIAS ---
             if (fullSynergy.includes('meta_staple')) score *= 1.25;
             if (fullSynergy.includes('meta_core')) score *= 1.2;
             if (fullSynergy.includes('meta_hammer')) score *= 1.15;
             if (fullSynergy.includes('secondary_scoring')) score *= 1.15;
             if (fullSynergy.includes('meta_artillery')) score *= 1.15;
             if (fullSynergy.includes('meta_ally')) score *= 1.15;

             return score;
        };

        availableInventory.sort((a, b) => {
            let scoreA = safeGetUtility(a, opponent);
            let scoreB = safeGetUtility(b, opponent);
            
            if (prioritizePainted) {
                if (['painted', 'parade'].includes(a.status || 'pile')) scoreA *= 2.0;
                if (['painted', 'parade'].includes(b.status || 'pile')) scoreB *= 2.0;
            }
            return scoreB - scoreA;
        });

        for (const unit of availableInventory) {
          if (unit.unique && newList.some(u => u.unitId === unit.unitId)) continue;
          
          const currentCount = newList.filter(u => u.unitId === unit.unitId).length;
          const isExempt = unit.role === 'Battleline' || unit.role === 'Dedicated Transport' || unit.role === 'Ally'; 
          if (!isExempt && currentCount >= 3) continue;
          if (isExempt && currentCount >= 6) continue;

          if (unit.role === 'Ally') {
             const currentAllyPoints = newList.filter(u => u.role === 'Ally').reduce((a,b) => a + b.points, 0);
             if (currentAllyPoints + unit.points > (targetPoints * 0.25)) continue;
          }

          const isChar = unit.role === 'Character' || unit.role === 'Epic Hero';
          const charCount = newList.filter(u => u.role === 'Character' || u.role === 'Epic Hero').length;
          if (isChar && charCount >= 4 && targetPoints <= 2000) continue; 

          if (currentPoints + unit.points <= targetPoints) {
            newList.push(unit);
            currentPoints += unit.points;
          }
        }

        let bestDetachment = DETACHMENTS[0]; 
        let maxScore = -1;
        const safeCheckList = newList.map(u => ({...u, synergy: u.synergy || '', name: u.name || '', role: u.role || ''}));

        DETACHMENTS.forEach(det => {
            let matchCount = 0;
            if (det.id === 'terminus_est') matchCount = safeCheckList.filter(u => u.role === 'Battleline' || u.name.includes('Poxwalker') || u.name.includes('Terminator')).length;
            else if (det.id === 'poxmongers') matchCount = safeCheckList.filter(u => u.synergy.includes('daemon_engine') || u.role === 'Vehicle' || u.name.includes('War Dog')).length;
            else if (det.id === 'wretched') matchCount = safeCheckList.filter(u => u.synergy.includes('psyker')).length;
            else if (det.id === 'mortarions_anvil') matchCount = safeCheckList.filter(u => u.name.includes('Deathshroud') || u.name.includes('Blightlord') || u.role === 'Character').length;
            else if (det.id === 'inexorable') matchCount = safeCheckList.filter(u => u.role === 'Dedicated Transport' || u.name.includes('Land Raider')).length;
            else if (det.id === 'ferrymen') matchCount = safeCheckList.filter(u => u.name.includes('Bloat-drone') || u.name.includes('Poxwalker') || u.name.includes('Blightlord')).length;
            else if (det.id === 'chosen_sons') matchCount = safeCheckList.filter(u => u.synergy.includes('torrent') || u.synergy.includes('flamer') || u.name.includes('Deathshroud')).length;
            else matchCount = 3; 

            if (det.id === 'terminus_est') {
                 const vehicleCount = safeCheckList.filter(u => u.role === 'Vehicle' && !u.name.includes('War Dog')).length;
                 if (vehicleCount > 0) matchCount = -100; 
            }
            if (matchCount > maxScore) {
                maxScore = matchCount;
                bestDetachment = det;
            }
        });

        setCurrentList(newList);
        setSuggestedDetachment(bestDetachment);
        showNotification(`Generated a ${currentPoints}pt list!`);
        setActiveTab('builder');
    } catch (err) {
        setAppError("Auto-Builder failed: " + err.message);
    }
  };

  const showNotification = (msg, type='success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const generateExportText = () => {
      const totalPoints = currentList.reduce((a, b) => a + b.points, 0);
      const detName = suggestedDetachment ? suggestedDetachment.name : "Plague Company";
      let text = `+++ MUSTER & MANIFEST ARMY LIST +++\n`;
      text += `POINTS: ${totalPoints} / ${targetPoints}\n`;
      text += `DETACHMENT: ${detName}\n\n`;
      
      const organized = organizeArmy(currentList);
      organized.forEach(item => {
          if (item.type === 'squad') {
              text += `[${item.body.points}pts] ${item.body.name} (${item.body.modelCount})\n`;
              item.leaders.forEach(l => {
                  text += `  + Leader: ${l.name} [${l.points}pts]\n`;
              });
          } else {
              text += `[${item.unit.points}pts] ${item.unit.name} (${item.unit.modelCount})\n`;
          }
      });
      return text;
  };

  const copyToClipboard = () => {
      const text = generateExportText();
      navigator.clipboard.writeText(text).then(() => showNotification("Copied!")).catch(() => showNotification("Failed to copy", "error"));
  };

  const downloadTextFile = () => {
      const text = generateExportText();
      const element = document.createElement("a");
      const file = new Blob([text], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = "death_guard_list.txt";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
  };

  const filteredDatabase = UNIT_DATABASE.filter(unit => 
    unit.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    unit.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const organizedList = organizeArmy(currentList);
  const contagionRange = gameTurn === 1 ? 3 : (gameTurn === 2 ? 6 : 9);
  
  const paintedCount = inventory.filter(u => ['painted', 'parade'].includes(u.status || 'pile')).length;
  const progressPercent = inventory.length > 0 ? Math.round((paintedCount / inventory.length) * 100) : 0;

  const activeStratagems = suggestedDetachment ? suggestedDetachment.stratagems : DETACHMENTS[0].stratagems;
  const activeDetachmentName = suggestedDetachment ? suggestedDetachment.name : DETACHMENTS[0].name;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans selection:bg-green-500/30" style={{backgroundColor: '#0f172a', color: '#e2e8f0'}}>
      <header className="bg-slate-950 border-b border-slate-800 p-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-green-600 p-2 rounded-lg">
              <Shield className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">Muster & Manifest</h1>
              <p className="text-xs text-green-400 font-medium tracking-wide">DEATH GUARD EDITION</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-6">
        <div className="flex gap-4 mb-8 border-b border-slate-800 overflow-x-auto pb-2">
          <button onClick={() => setActiveTab('inventory')} className={`pb-4 px-2 flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'inventory' ? 'border-b-2 border-green-500 text-green-400' : 'text-slate-500 hover:text-slate-300'}`}>
            <Box size={18} /> Collection <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full text-xs">{inventory.length}</span>
          </button>
          <button onClick={() => setActiveTab('builder')} className={`pb-4 px-2 flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'builder' ? 'border-b-2 border-green-500 text-green-400' : 'text-slate-500 hover:text-slate-300'}`}>
            <Zap size={18} /> Auto-Builder
          </button>
          <button onClick={() => setActiveTab('battle')} className={`pb-4 px-2 flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'battle' ? 'border-b-2 border-red-500 text-red-400' : 'text-slate-500 hover:text-slate-300'}`}>
            <Sword size={18} /> Command Bunker
          </button>
          <button onClick={() => setActiveTab('wishlist')} className={`pb-4 px-2 flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'wishlist' ? 'border-b-2 border-yellow-500 text-yellow-400' : 'text-slate-500 hover:text-slate-300'}`}>
            <ShoppingBag size={18} /> Acquisitions
          </button>
        </div>
        
        {activeTab === 'inventory' && (
            <div className="space-y-8">
              {/* MY HANGAR */}
              <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden flex flex-col h-[600px]">
                 <div className="p-4 bg-slate-900/50 border-b border-slate-700 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                          <Box className="text-green-500" size={20} /> My Hangar
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="text-xs text-slate-400">Painting Progress</div>
                            <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 transition-all" style={{width: `${progressPercent}%`}}></div>
                            </div>
                            <div className="text-xs font-bold text-green-400">{progressPercent}%</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                          <span className="text-2xl font-bold text-green-500">{inventory.reduce((a,b) => a + b.points, 0)}</span>
                          <span className="text-xs text-slate-500 ml-1">pts total</span>
                      </div>
                      <button onClick={resetData} className="text-slate-600 hover:text-red-500 p-2" title="Reset All Data"><RotateCcw size={16} /></button>
                    </div>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto divide-y divide-slate-700/50 p-2">
                    {inventory.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500">
                            <Skull size={40} className="mb-2 opacity-20"/>
                            <p>Your hangar is empty.</p>
                        </div>
                    ) : (
                        inventory.map(item => {
                            const dbUnit = UNIT_DATABASE.find(d => d.id === item.unitId) || { sizes: [1], basePoints: 0 };
                            const status = PAINT_STATUS[item.status || 'pile'];
                            const StatusIcon = status.icon;
                            const isEditing = editingPointsId === item.uuid;
                            const isWargearOpen = expandedWargearId === item.uuid;

                            return (
                                <div key={item.uuid} className={`p-3 flex flex-col gap-3 hover:bg-slate-700/20 rounded transition-colors border-l-4 ${status.border}`}>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded flex items-center justify-center bg-slate-800 ${status.color}`}>
                                                <StatusIcon size={20} />
                                            </div>
                                            <div>
                                                <div className="font-medium text-white">{item.name}</div>
                                                <div className="text-xs text-slate-400 flex items-center gap-2">
                                                    {isEditing ? (
                                                        <div className="flex items-center gap-1">
                                                            <input 
                                                                type="number" 
                                                                value={tempPoints} 
                                                                onChange={(e) => setTempPoints(parseInt(e.target.value) || 0)}
                                                                className="w-16 bg-slate-900 border border-slate-600 rounded px-1 py-0.5 text-green-400 font-mono"
                                                            />
                                                            <button onClick={() => savePoints(item.uuid)} className="text-green-500 hover:text-green-400"><CheckCircle2 size={14}/></button>
                                                        </div>
                                                    ) : (
                                                        <span className="font-mono text-green-400 flex items-center gap-1">
                                                            {item.points} pts
                                                            <button onClick={() => startEditingPoints(item)} className="text-slate-600 hover:text-slate-400"><Edit3 size={10}/></button>
                                                        </span>
                                                    )}
                                                    <span>•</span>
                                                    <span>{item.role}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 self-end sm:self-auto">
                                            {/* Painting Status Selector */}
                                            <select 
                                                value={item.status || 'pile'}
                                                onChange={(e) => updateUnitStatus(item.uuid, e.target.value)}
                                                className="bg-slate-900 text-xs text-slate-300 border border-slate-700 rounded px-2 py-1 focus:outline-none max-w-[100px] truncate"
                                            >
                                                {Object.entries(PAINT_STATUS).map(([key, val]) => (
                                                    <option key={key} value={key}>{val.label}</option>
                                                ))}
                                            </select>

                                            {/* WARGEAR CONFIG BUTTON */}
                                            {dbUnit.wargearProfiles && (
                                                <button 
                                                    onClick={() => setExpandedWargearId(isWargearOpen ? null : item.uuid)}
                                                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors ${isWargearOpen || (item.activeWargear && item.activeWargear.length > 0) ? 'bg-blue-900/50 border-blue-500 text-blue-300' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
                                                >
                                                    <Wrench size={10} />
                                                    {isWargearOpen ? 'Done' : 'Gear'}
                                                    {isWargearOpen ? <ChevronUp size={10}/> : <ChevronDown size={10}/>}
                                                </button>
                                            )}

                                            {dbUnit.sizes && dbUnit.sizes.length > 1 && (
                                                <div className="flex items-center gap-2 bg-slate-900 rounded px-2 py-1 border border-slate-700">
                                                    <span className="text-[10px] text-slate-500 uppercase font-bold">Size</span>
                                                    <select value={item.modelCount} onChange={(e) => updateUnitSize(item.uuid, parseInt(e.target.value))} className="bg-transparent text-white text-sm font-mono focus:outline-none cursor-pointer">
                                                        {dbUnit.sizes.map(size => ( <option key={size} value={size}>{size}</option> ))}
                                                    </select>
                                                </div>
                                            )}
                                            <button onClick={() => removeFromInventory(item.uuid)} className="text-slate-500 hover:text-red-400 p-1.5 hover:bg-slate-700 rounded"><X size={18} /></button>
                                        </div>
                                    </div>
                                    
                                    {/* WARGEAR EXPANSION PANEL */}
                                    {isWargearOpen && dbUnit.wargearProfiles && (
                                        <div className="bg-slate-900/80 p-3 rounded border border-blue-900/50 mt-1">
                                            <div className="text-[10px] text-blue-400 font-bold uppercase mb-2">Select Active Capabilities (Multiple Allowed)</div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {dbUnit.wargearProfiles.map(profile => {
                                                    const isActive = (item.activeWargear || []).includes(profile.name);
                                                    return (
                                                        <button 
                                                            key={profile.name}
                                                            onClick={() => toggleWargear(item.uuid, profile.name)}
                                                            className={`text-left text-xs p-2 rounded border transition-all ${isActive ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'}`}
                                                        >
                                                            <div className="font-bold">{profile.name}</div>
                                                            <div className={`text-[10px] ${isActive ? 'text-blue-200' : 'text-slate-600'}`}>{profile.desc}</div>
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* WARGEAR PILLS (SUMMARY) */}
                                    {item.activeWargear && item.activeWargear.length > 0 && !isWargearOpen && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {item.activeWargear.map(w => (
                                                <span key={w} className="text-[10px] bg-blue-900/30 text-blue-300 px-1.5 py-0.5 rounded border border-blue-900/50">{w}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                 </div>
              </div>

              {/* CATALOG */}
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg flex flex-col h-[600px]">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4 shrink-0">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Plus className="text-green-500" /> Unit Catalog
                    </h2>
                    <p className="text-slate-400 text-sm">Tap (+) to add to Hangar.</p>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-grow md:flex-grow-0">
                        <Search className="absolute left-2.5 top-2.5 text-slate-500" size={16} />
                        <input type="text" placeholder="Search units..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-white pl-9 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:border-green-500"/>
                    </div>
                    <button onClick={() => setSortMethod('role')} className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${sortMethod === 'role' ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300'}`}>Role</button>
                    <button onClick={() => setSortMethod('points')} className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${sortMethod === 'points' ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300'}`}>Points</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto pr-2 content-start">
                  {filteredDatabase.sort((a,b) => {
                      if (sortMethod === 'points') return b.basePoints - a.basePoints;
                      return a.role.localeCompare(b.role);
                  }).map(unit => {
                    return (
                      <div key={unit.id} className="p-3 rounded-lg border bg-slate-800 border-slate-700 hover:border-slate-500 transition-all group h-fit">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-semibold text-white text-sm group-hover:text-green-200 transition-colors line-clamp-1" title={unit.name}>{unit.name}</div>
                            <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                              <span className={`px-1.5 py-0.5 rounded ${roleColor(unit.role)}`}>{unit.role}</span>
                            </div>
                            <div className="mt-1 font-mono text-slate-300 text-xs">
                                {unit.basePoints} pts {unit.sizes ? ` (${unit.sizes[0]} models)` : ''}
                            </div>
                          </div>
                          <button onClick={() => addToInventory(unit)} className="p-2 bg-slate-700 hover:bg-green-600 rounded-lg text-slate-300 hover:text-white transition-all shadow-sm shrink-0"><Plus size={18} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
        )}

        {activeTab === 'builder' && (
            <div className="space-y-6">
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                         <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Calculator className="text-green-500" /> Army Builder
                            </h2>
                            <p className="text-slate-400 text-sm">Configure your mission parameters.</p>
                         </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
                            <label className="text-xs text-slate-400 uppercase font-bold mb-1 block flex items-center gap-2">
                                <Target size={14}/> Game Size
                            </label>
                            <select value={targetPoints} onChange={(e) => setTargetPoints(parseInt(e.target.value))} className="w-full bg-slate-800 text-white font-bold p-2 rounded border border-slate-600 focus:outline-none">
                                <option value="500">500 pts (Combat Patrol)</option>
                                <option value="1000">1000 pts (Incursion)</option>
                                <option value="1500">1500 pts (Strike Force)</option>
                                <option value="2000">2000 pts (Strike Force)</option>
                                <option value="3000">3000 pts (Onslaught)</option>
                            </select>
                         </div>

                         <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
                            <label className="text-xs text-slate-400 uppercase font-bold mb-1 block flex items-center gap-2">
                                <Skull size={14} className="text-red-400"/> Enemy Faction
                            </label>
                            <select value={opponent} onChange={(e) => setOpponent(e.target.value)} className="w-full bg-slate-800 text-white font-bold p-2 rounded border border-slate-600 focus:outline-none">
                                {OPPONENTS.map(op => (<option key={op.id} value={op.id}>{op.label}</option>))}
                            </select>
                            <div className="text-[10px] text-slate-500 mt-1 truncate">
                                {OPPONENTS.find(o => o.id === opponent)?.name}
                            </div>
                         </div>
                    </div>

                    {/* PAINTED FILTER TOGGLE */}
                    <button 
                        onClick={() => setPrioritizePainted(!prioritizePainted)}
                        className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-bold border transition-all ${prioritizePainted ? 'bg-green-900/50 border-green-500 text-green-400' : 'bg-slate-900 border-slate-700 text-slate-500'}`}
                    >
                        <Brush size={16} /> 
                        {prioritizePainted ? "Prioritizing Painted Models" : "Use All Models"}
                    </button>

                    <button onClick={generateSmartList} className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-900/20 font-bold">
                        <Zap size={20} /> <span>Auto-Generate List</span>
                    </button>
                </div>
              </div>

              {/* BATTLE PLANS SECTION */}
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
                  <div className="flex items-center gap-2 mb-4 text-green-400 font-bold">
                      <FolderOpen size={18}/> <span>Battle Plans</span>
                  </div>
                  <div className="flex gap-2 mb-4">
                      <input 
                        type="text" 
                        value={listName} 
                        onChange={(e) => setListName(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 text-white text-sm focus:border-green-500 focus:outline-none"
                      />
                      <button onClick={saveCurrentList} className="bg-green-700 hover:bg-green-600 px-3 py-2 rounded text-white text-sm font-bold flex items-center gap-1"><Save size={14}/> Save</button>
                  </div>
                  
                  {savedLists.length > 0 && (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                          {savedLists.map(plan => (
                              <div key={plan.id} className="flex items-center justify-between bg-slate-900/50 p-2 rounded border border-slate-700">
                                  <div className="flex flex-col">
                                      <span className="text-white text-sm font-bold">{plan.name}</span>
                                      <span className="text-[10px] text-slate-500">{plan.targetPoints}pts • {plan.detachment?.name || 'No Detachment'}</span>
                                  </div>
                                  <div className="flex gap-2">
                                      <button onClick={() => loadList(plan)} className="text-blue-400 hover:text-blue-300" title="Load"><Disc size={16}/></button>
                                      <button onClick={() => deleteList(plan.id)} className="text-red-400 hover:text-red-300" title="Delete"><Trash2 size={16}/></button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>

              {suggestedDetachment && (
                  <div className="bg-gradient-to-r from-green-900/50 to-slate-900 p-4 rounded-xl border border-green-500/30 flex items-start gap-4">
                      <div className="bg-green-600/20 p-2 rounded-lg"><FileText className="text-green-400" size={24} /></div>
                      <div>
                          <div className="text-xs text-green-400 font-bold uppercase tracking-wider mb-1">Recommended Detachment</div>
                          <h3 className="text-xl font-bold text-white">{suggestedDetachment.name}</h3>
                          <p className="text-slate-300 text-sm mt-1">{suggestedDetachment.desc}</p>
                      </div>
                  </div>
              )}

              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 min-h-[400px]">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-700">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Current Detachment</h3>
                    <div className="flex items-center gap-2 mt-1">
                       {currentList.reduce((a, b) => a + b.points, 0) > targetPoints ? (
                         <span className="text-red-400 text-sm flex items-center gap-1"><AlertTriangle size={14}/> Over Limit</span>
                       ) : (
                         <span className="text-green-400 text-sm flex items-center gap-1"><CheckCircle2 size={14}/> Legal</span>
                       )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => setShowExportModal(true)} disabled={currentList.length === 0} className="bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm font-medium flex items-center gap-2 transition-colors">
                        <Share2 size={14} /> Export
                     </button>
                     <div className="text-right">
                        <div className={`text-3xl font-bold ${currentList.reduce((a, b) => a + b.points, 0) > targetPoints ? 'text-red-400' : 'text-white'}`}>
                            {currentList.reduce((a, b) => a + b.points, 0)} <span className="text-lg text-slate-500">/ {targetPoints}</span>
                        </div>
                        <button onClick={clearList} className="text-xs text-red-400 hover:underline mt-1">Clear List</button>
                     </div>
                  </div>
                </div>

                {organizedList.length === 0 ? (
                  <div className="text-center py-20 text-slate-500">
                    <Shield size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Your roster is empty.</p>
                    <p className="text-sm">Configure parameters above and click Auto-Generate.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {organizedList.map((item, idx) => {
                      if (item.type === 'single') {
                        const unit = item.unit;
                        return (
                          <div key={idx} className="flex items-center justify-between p-3 bg-slate-700/30 rounded border border-slate-700/50">
                            <div className="flex items-center gap-3">
                              <div className={`w-1 h-8 rounded-full ${roleColor(unit.role, true)}`}></div>
                              <div>
                                <div className="text-white font-medium">{unit.name}</div>
                                <div className="text-xs text-slate-400 flex items-center gap-2">
                                    {unit.role} • <span className="text-slate-300">{unit.modelCount} Models</span>
                                    {/* Render Active Wargear in List */}
                                    {unit.activeWargear && unit.activeWargear.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {unit.activeWargear.map(w => <span key={w} className="text-[8px] bg-blue-900/30 text-blue-300 px-1 rounded border border-blue-900/50">{w}</span>)}
                                        </div>
                                    )}
                                    {OPPONENTS.find(o => o.id === opponent)?.priority.some(tag => {
                                        // Re-calculate full synergy for icon display
                                        let fullSynergy = unit.synergy || '';
                                        const dbUnit = UNIT_DATABASE.find(db => db.id === unit.unitId);
                                        if (dbUnit && dbUnit.wargearProfiles && unit.activeWargear) {
                                            unit.activeWargear.forEach(pName => {
                                                const p = dbUnit.wargearProfiles.find(x => x.name === pName);
                                                if (p) fullSynergy += ' ' + p.tags;
                                            });
                                        }
                                        return fullSynergy.includes(tag);
                                    }) && (
                                        <span className="text-yellow-400 ml-1 flex items-center gap-0.5" title="Effective against selected enemy"><Target size={10}/> Counter</span>
                                    )}
                                </div>
                              </div>
                            </div>
                            <div className="font-mono text-slate-300">{unit.points} pts</div>
                          </div>
                        );
                      } else {
                        // SQUAD CARD
                        const squadPoints = item.body.points + item.leaders.reduce((a,l) => a+l.points, 0);
                        return (
                          <div key={idx} className="bg-slate-700/50 rounded-lg border border-slate-600 overflow-hidden">
                             <div className="p-3 bg-slate-800/80 border-b border-slate-600 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Users className="text-green-400" size={16}/>
                                    <span className="font-bold text-white text-sm">Attached Squad</span>
                                </div>
                                <span className="font-mono text-green-400 font-bold">{squadPoints} pts</span>
                             </div>
                             <div className="p-2 space-y-2">
                                {item.leaders.map((l, lIdx) => (
                                    <div key={`l-${lIdx}`} className="flex items-center justify-between p-2 bg-slate-800/50 rounded border border-yellow-500/20">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1 h-6 rounded-full bg-yellow-600"></div>
                                            <div>
                                                <div className="text-sm font-medium text-yellow-100">{l.name}</div>
                                                <div className="text-[10px] text-yellow-500/70 uppercase font-bold">Leader</div>
                                            </div>
                                        </div>
                                        <div className="text-xs text-slate-400">{l.points} pts</div>
                                    </div>
                                ))}
                                <div className="flex items-center justify-between p-2 bg-slate-800/50 rounded border border-slate-700">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1 h-6 rounded-full ${roleColor(item.body.role, true)}`}></div>
                                        <div>
                                            <div className="text-sm font-medium text-white">{item.body.name}</div>
                                            <div className="text-[10px] text-slate-500 uppercase font-bold">Bodyguard • {item.body.modelCount} Models</div>
                                            {/* Render Active Wargear in List */}
                                            {item.body.activeWargear && item.body.activeWargear.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-0.5">
                                                    {item.body.activeWargear.map(w => <span key={w} className="text-[8px] bg-blue-900/30 text-blue-300 px-1 rounded border border-blue-900/50">{w}</span>)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-xs text-slate-400">{item.body.points} pts</div>
                                </div>
                             </div>
                          </div>
                        );
                      }
                    })}
                  </div>
                )}
              </div>
            </div>
        )}

        {/* --- ACQUISITIONS (WISHLIST) TAB --- */}
        {activeTab === 'wishlist' && (
            <div className="space-y-6">
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <ShoppingBag className="text-yellow-500" /> Vector Expansion
                                </h2>
                                <p className="text-slate-400 text-sm">Generate optimal lists including units you don't own yet.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
                                <label className="text-xs text-slate-400 uppercase font-bold mb-1 block flex items-center gap-2">
                                    <Target size={14}/> Target Game Size
                                </label>
                                <select value={targetPoints} onChange={(e) => setTargetPoints(parseInt(e.target.value))} className="w-full bg-slate-800 text-white font-bold p-2 rounded border border-slate-600 focus:outline-none">
                                    <option value="500">500 pts (Combat Patrol)</option>
                                    <option value="1000">1000 pts (Incursion)</option>
                                    <option value="1500">1500 pts (Strike Force)</option>
                                    <option value="2000">2000 pts (Strike Force)</option>
                                    <option value="3000">3000 pts (Onslaught)</option>
                                </select>
                            </div>

                            <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
                                <label className="text-xs text-slate-400 uppercase font-bold mb-1 block flex items-center gap-2">
                                    <Skull size={14} className="text-red-400"/> Enemy Faction
                                </label>
                                <select value={opponent} onChange={(e) => setOpponent(e.target.value)} className="w-full bg-slate-800 text-white font-bold p-2 rounded border border-slate-600 focus:outline-none">
                                    {OPPONENTS.map(op => (<option key={op.id} value={op.id}>{op.label}</option>))}
                                </select>
                            </div>
                        </div>

                        <button onClick={generateDreamList} className="w-full bg-yellow-600 hover:bg-yellow-500 text-white py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-yellow-900/20 font-bold">
                            <Zap size={20} /> <span>Calculate Dream List</span>
                        </button>
                    </div>
                </div>

                {dreamList.length > 0 && (
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 min-h-[400px]">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-700">
                            <div>
                                <h3 className="text-lg font-semibold text-white">Recommended Acquisitions</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-slate-400 text-sm">
                                        Total Points: <span className="text-white font-bold">{dreamList.reduce((a, b) => a + b.points, 0)}</span>
                                    </span>
                                    <span className="text-slate-500 text-sm mx-2">|</span>
                                    <span className="text-yellow-400 text-sm font-bold">
                                        To Buy: {dreamList.filter(u => !u.isOwned).reduce((a,b) => a + b.points, 0)} pts
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {/* Owned Units */}
                            <div className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2">From Collection</div>
                            {dreamList.filter(u => u.isOwned).map((unit, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-700/30 rounded border border-green-900/30 opacity-75">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-1 h-8 rounded-full ${roleColor(unit.role, true)}`}></div>
                                        <div>
                                            <div className="text-white font-medium">{unit.name}</div>
                                            <div className="text-xs text-slate-400">{unit.role}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 size={14} className="text-green-500"/>
                                        <div className="font-mono text-slate-300">{unit.points} pts</div>
                                    </div>
                                </div>
                            ))}

                            {/* Missing Units */}
                            {dreamList.some(u => !u.isOwned) && (
                                <>
                                    <div className="text-xs font-bold text-yellow-400 uppercase tracking-wider mt-6 mb-2">Recommended Purchases</div>
                                    {dreamList.filter(u => !u.isOwned).map((unit, idx) => (
                                        <div key={`buy-${idx}`} className="flex items-center justify-between p-3 bg-yellow-900/10 rounded border border-yellow-500/50">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-1 h-8 rounded-full ${roleColor(unit.role, true)}`}></div>
                                                <div>
                                                    <div className="text-white font-medium">{unit.name}</div>
                                                    <div className="text-xs text-slate-400 flex items-center gap-2">
                                                        {unit.role}
                                                        {OPPONENTS.find(o => o.id === opponent)?.priority.some(tag => (unit.synergy || '').includes(tag)) && (
                                                            <span className="text-yellow-400 ml-1 flex items-center gap-0.5" title="Effective against selected enemy"><Target size={10}/> Counter</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <ShoppingBag size={14} className="text-yellow-500"/>
                                                <div className="font-mono text-yellow-200 font-bold">{unit.points} pts</div>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* --- COMMAND BUNKER (PHASE 1 + PHASE 3) --- */}
        {activeTab === 'battle' && (
            <div className="space-y-6">
                
                {/* 1. TURN & CONTAGION TRACKER */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
                    <div className="bg-slate-900/50 p-4 border-b border-slate-700 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Timer className="text-green-400" />
                            <h2 className="text-lg font-bold text-white">Battle Round</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setGameTurn(Math.max(1, gameTurn - 1))} className="w-8 h-8 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white">-</button>
                            <span className="text-2xl font-bold text-white w-8 text-center">{gameTurn}</span>
                            <button onClick={() => setGameTurn(Math.min(5, gameTurn + 1))} className="w-8 h-8 rounded bg-green-600 hover:bg-green-500 flex items-center justify-center text-white">+</button>
                        </div>
                    </div>
                    <div className="p-6 text-center">
                        <div className="text-sm text-slate-400 uppercase tracking-widest font-bold mb-2">Current Nurgle's Gift Range</div>
                        <div className="text-6xl font-black text-green-500 drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]">
                            {contagionRange}"
                        </div>
                        
                        {/* PLAGUE SELECTOR */}
                        <div className="mt-4 pt-4 border-t border-slate-700">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <Biohazard size={16} className="text-yellow-500" />
                                <span className="text-xs font-bold text-slate-300 uppercase">Active Plague</span>
                            </div>
                            <select 
                                value={selectedSickness} 
                                onChange={(e) => setSelectedSickness(e.target.value)}
                                className="bg-slate-900 border border-slate-600 text-white text-sm rounded-lg p-2 w-full max-w-xs focus:outline-none focus:border-green-500"
                            >
                                {SICKNESSES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        <div className="text-xs text-slate-400 mt-4 bg-slate-900/50 p-3 rounded border border-slate-700 inline-block text-left">
                            <div className="font-bold text-green-400 mb-1">AURA EFFECTS:</div>
                            <ul className="list-disc pl-4 space-y-1">
                                <li>Subtract 1 from Toughness</li>
                                <li>{SICKNESSES.find(s => s.id === selectedSickness)?.effect}</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* 2. NURGLE'S MATH (WOUND CALCULATOR) - NEW PHASE 3 FEATURE */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Percent className="text-blue-400" />
                        <h3 className="font-bold text-white">Nurgle's Math (Wound Roll)</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="text-xs text-slate-400 uppercase font-bold block mb-1">My Strength</label>
                            <input 
                                type="number" 
                                value={mathStr}
                                onChange={(e) => setMathStr(parseInt(e.target.value) || 0)}
                                className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white font-mono text-center"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 uppercase font-bold block mb-1">Enemy Toughness</label>
                            <input 
                                type="number" 
                                value={mathTough}
                                onChange={(e) => setMathTough(parseInt(e.target.value) || 0)}
                                className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white font-mono text-center"
                            />
                        </div>
                    </div>
                    
                    <div className="bg-slate-900/50 p-3 rounded border border-slate-700 flex justify-between items-center">
                        <div className="text-xs text-slate-400">
                            <div>Target T modified to: <span className="text-green-400 font-bold">{Math.max(1, mathTough - 1)}</span></div>
                            <div className="text-[10px] text-slate-500">(Due to Nurgle's Gift Aura)</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-slate-400 uppercase">Wound Roll</div>
                            <div className="text-3xl font-black text-white">{getWoundRoll()}+</div>
                        </div>
                    </div>
                </div>

                {/* 3. STRATAGEM LIBRARY - DETACHMENT SPECIFIC */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <BookOpen className="text-purple-400" />
                        <div className="flex flex-col">
                            <h3 className="font-bold text-white">Stratagems</h3>
                            <span className="text-[10px] text-slate-400 uppercase">{activeDetachmentName}</span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {activeStratagems.map((strat, idx) => (
                            <div key={idx} className="bg-slate-900/50 p-3 rounded border border-slate-700">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-purple-300 text-sm">{strat.name}</span>
                                    <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded border border-slate-600">{strat.cp}CP</span>
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono mb-1 uppercase">{strat.phase}</div>
                                <div className="text-xs text-slate-300">{strat.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. SCOREBOARD */}
                <div className="grid grid-cols-2 gap-4">
                    {/* PLAYER */}
                    <div className="bg-slate-800 rounded-xl border border-green-500/30 p-4 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
                        <h3 className="text-center text-green-400 font-bold mb-4">YOU</h3>
                        
                        <div className="flex justify-between mb-4">
                            <div className="text-center">
                                <div className="text-xs text-slate-500 mb-1">CP</div>
                                <div className="text-2xl font-bold text-white">{scores.cpMe}</div>
                                <div className="flex gap-1 justify-center mt-1">
                                    <button onClick={() => setScores({...scores, cpMe: Math.max(0, scores.cpMe - 1)})} className="w-6 h-6 bg-slate-700 rounded text-xs">-</button>
                                    <button onClick={() => setScores({...scores, cpMe: scores.cpMe + 1})} className="w-6 h-6 bg-green-600 rounded text-xs">+</button>
                                </div>
                            </div>
                            <div className="text-center border-l border-slate-700 pl-4">
                                <div className="text-xs text-slate-500 mb-1">VP</div>
                                <div className="text-2xl font-bold text-white">{scores.vpMe}</div>
                                <div className="flex gap-1 justify-center mt-1">
                                    <button onClick={() => setScores({...scores, vpMe: Math.max(0, scores.vpMe - 1)})} className="w-6 h-6 bg-slate-700 rounded text-xs">-</button>
                                    <button onClick={() => setScores({...scores, vpMe: scores.vpMe + 1})} className="w-6 h-6 bg-green-600 rounded text-xs">+</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* OPPONENT */}
                    <div className="bg-slate-800 rounded-xl border border-red-500/30 p-4 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
                        <h3 className="text-center text-red-400 font-bold mb-4">ENEMY</h3>
                        
                        <div className="flex justify-between mb-4">
                            <div className="text-center">
                                <div className="text-xs text-slate-500 mb-1">CP</div>
                                <div className="text-2xl font-bold text-white">{scores.cpOpp}</div>
                                <div className="flex gap-1 justify-center mt-1">
                                    <button onClick={() => setScores({...scores, cpOpp: Math.max(0, scores.cpOpp - 1)})} className="w-6 h-6 bg-slate-700 rounded text-xs">-</button>
                                    <button onClick={() => setScores({...scores, cpOpp: scores.cpOpp + 1})} className="w-6 h-6 bg-red-600 rounded text-xs">+</button>
                                </div>
                            </div>
                            <div className="text-center border-l border-slate-700 pl-4">
                                <div className="text-xs text-slate-500 mb-1">VP</div>
                                <div className="text-2xl font-bold text-white">{scores.vpOpp}</div>
                                <div className="flex gap-1 justify-center mt-1">
                                    <button onClick={() => setScores({...scores, vpOpp: Math.max(0, scores.vpOpp - 1)})} className="w-6 h-6 bg-slate-700 rounded text-xs">-</button>
                                    <button onClick={() => setScores({...scores, vpOpp: scores.vpOpp + 1})} className="w-6 h-6 bg-red-600 rounded text-xs">+</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. STICKY OBJECTIVES */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Flag className="text-yellow-500" />
                        <h3 className="font-bold text-white">Sticky Objectives</h3>
                    </div>
                    <p className="text-xs text-slate-400 mb-4">Track infected objectives (Remorseless). Remain under control even if you leave.</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta'].map(obj => {
                            const key = obj.toLowerCase();
                            const isActive = objectives[key];
                            return (
                                <button
                                    key={key}
                                    onClick={() => setObjectives({...objectives, [key]: !isActive})}
                                    className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${isActive ? 'bg-green-900/50 border-green-500 text-green-400' : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-600'}`}
                                >
                                    <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500 shadow-[0_0_8px_rgba(74,222,128,0.8)]' : 'bg-slate-700'}`}></div>
                                    <span className="font-bold text-sm">{obj}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

            </div>
        )}

      </main>

      {/* Notifications and Modals */}
      {notification && (
        <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-lg shadow-2xl transform transition-all animate-bounce ${notification.type === 'error' ? 'bg-red-600' : 'bg-green-600'} text-white font-medium flex items-center gap-2 z-50`}>
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <Circle size={18} />}
          {notification.msg}
        </div>
      )}

      {showExportModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
              <div className="bg-slate-800 rounded-xl max-w-2xl w-full border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">
                  <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <FileText className="text-green-400"/> Export Army List
                      </h3>
                      <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-white">
                          <X size={24}/>
                      </button>
                  </div>
                  <div className="p-4 flex-1 overflow-hidden">
                      <textarea readOnly value={generateExportText()} className="w-full h-64 md:h-96 bg-slate-950 text-green-400 font-mono text-xs md:text-sm p-4 rounded border border-slate-700 focus:outline-none resize-none"/>
                  </div>
                  <div className="p-4 border-t border-slate-700 bg-slate-900/50 rounded-b-xl flex gap-3 justify-end">
                      <button onClick={copyToClipboard} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-medium transition-colors">
                          <Copy size={16}/> Copy to Clipboard
                      </button>
                      <button onClick={downloadTextFile} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded font-medium transition-colors">
                          <Download size={16}/> Download .txt
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}

// --- APP WRAPPER ---
export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function roleColor(role, bg = false) {
  const map = {
    'Epic Hero': 'bg-yellow-600/20 text-yellow-500',
    'Character': 'bg-yellow-500/20 text-yellow-500',
    'Battleline': 'bg-green-500/20 text-green-500',
    'Infantry': 'bg-purple-500/20 text-purple-500',
    'Vehicle': 'bg-blue-500/20 text-blue-500',
    'Dedicated Transport': 'bg-orange-500/20 text-orange-500',
    'Fortification': 'bg-slate-400/20 text-slate-400',
    'Ally': 'bg-red-500/20 text-red-400',
  };
  const bgMap = {
    'Epic Hero': 'bg-yellow-600',
    'Character': 'bg-yellow-500',
    'Battleline': 'bg-green-500',
    'Infantry': 'bg-purple-500',
    'Vehicle': 'bg-blue-500',
    'Dedicated Transport': 'bg-orange-500',
    'Fortification': 'bg-slate-400',
    'Ally': 'bg-red-500',
  };
  return bg ? (bgMap[role] || 'bg-slate-500') : (map[role] || 'text-slate-500');
}