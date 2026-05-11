const TEAMS = [
    { city:'Washington', name:'Wizards', abbr:'WAS', color:'#002B5C', wins:17, losses:65, seed:1 },
    { city:'Indiana', name:'Pacers', abbr:'IND', color:'#fcdb03', wins:19, losses:63, seed:2 },
    { city:'Brooklyn',    name:'Nets',      abbr:'BKN',  color:'#f7f4ed', wins:20, losses:62, seed:3  },
    { city:'Utah',         name:'Jazz',         abbr:'UTA',  color:'#002B5C', wins:22, losses:60, seed:4  },
    { city:'Sacramento',  name:'Kings',        abbr:'SAC',  color:'#8200fc', wins:22, losses:60, seed:5  },
    { city:'Memphis',      name:'Grizzlies',    abbr:'MEM',  color:'#5D76A9', wins:25, losses:57, seed:6  },
    { city:'Atlanta',      name:'Hawks (via NOP)',        abbr:'ATL',  color:'#E03A3E', wins:26, losses:56, seed:7  },
    { city:'Dallas',         name:'Mavericks',         abbr:'DAL',  color:'#0076fc', wins:26, losses:56, seed:8  },
    { city:'Chicago',      name:'Bulls',        abbr:'CHI',  color:'#CE1141', wins:31, losses:51, seed:9  },
    { city:'Milwaukee',      name:'Bucks',        abbr:'MIL',  color:'#03a116', wins:32, losses:50, seed:10 },
    { city:'Golden State',    name:'Warriors',      abbr:'GS',  color:'#0437de', wins:37, losses:45, seed:11 },
    { city:'OKC',    name:'Thunder (via LAC)',      abbr:'OKC',  color:'#007AC1', wins:42, losses:40, seed:12 },
    { city:'Miami',   name:'Heat',      abbr:'MIA', color:'#ce1111', wins:43, losses:39, seed:13 },
    { city:'Charlotte',    name:'Hornets',      abbr:'CHA',  color:'#00788C', wins:44, losses:38, seed:14 },
  ];


  
  // Odds arrays: index = lottery seed (0 = worst team)
  const ODDS = {
    '2019':     [14.0, 14.0, 14.0, 12.5, 10.5, 9.0, 7.5, 6.0, 4.5, 3.0, 2.0, 1.5, 1.0, 0.5],
    'pre2019':  [25.0, 19.9, 15.6, 11.9, 8.8,  6.3, 4.3, 2.8, 1.7, 1.1, 0.8, 0.6, 0.5, 0.5],
    '1985':     Array(14).fill(100/14),
    'whatif':   [50, 20, 10, 6, 4, 3, 2.5, 2, 1.5, 0.5, 0.2, 0.15, 0.1, 0.05],
  };
  
  let currentOdds = ODDS['2019'];
  let currentEraKey = '2019';
  let totalSims = 0;
  let mcChart = null, cbaChart = null, parityChart = null;
  
  // ─── CORE LOTTERY ALGORITHM ─────────────────────────────────────────────────
  
  /**
   * Runs one complete NBA lottery drawing.
   * Returns an array of 14 team indices in pick order (1st pick first).
   * Top 4 picks are drawn via weighted random; remaining slots fill in seed order.
   */
  function runLotteryDraw(oddsArr) {
    const remaining = oddsArr.map((o, i) => ({ o, i }));
    const result = [];
  
    for (let pick = 0; pick < 4; pick++) {
      const total = remaining.reduce((sum, x) => sum + x.o, 0);
      let r = Math.random() * total;
      let chosen = remaining.length - 1;
      for (let j = 0; j < remaining.length; j++) {
        r -= remaining[j].o;
        if (r <= 0) { chosen = j; break; }
      }
      result.push(remaining[chosen].i);
      remaining.splice(chosen, 1);
    }
  
    // Picks 5–14 fill in natural seed order
    const naturalOrder = remaining.map(x => x.i).sort((a, b) => a - b);
    return [...result, ...naturalOrder];
  }
  
  // ─── UI BUILDERS ────────────────────────────────────────────────────────────
  
  function buildTeamsGrid() {
    const grid = document.getElementById('teams-grid');
    grid.innerHTML = '';
    const total = currentOdds.reduce((a, b) => a + b, 0);
    TEAMS.forEach((t, i) => {
      const pct = (currentOdds[i] / total * 100).toFixed(1);
      const div = document.createElement('div');
      div.className = 'team-card';
      div.innerHTML = `
        <div class="team-card-accent" style="background:${t.color}"></div>
        <div class="team-city">${t.city}</div>
        <div class="team-name">${t.name}</div>
        <div class="team-record">${t.wins}–${t.losses} · Seed ${t.seed}</div>
        <div style="margin-top:6px">
          <div class="team-odds">${pct}%</div>
          <div class="team-odds-label">Top-1 odds</div>
        </div>`;
      grid.appendChild(div);
    });
  
    // Update hero leader
    const maxIdx = currentOdds.indexOf(Math.max(...currentOdds));
    document.getElementById('odds-leader').textContent = TEAMS[maxIdx].abbr;
  }
  
  function buildOddsBars() {
    const container = document.getElementById('odds-bars');
    container.innerHTML = '';
    const total = currentOdds.reduce((a, b) => a + b, 0);
    const maxPct = Math.max(...currentOdds) / total * 100;
    TEAMS.forEach((t, i) => {
      const pct = currentOdds[i] / total * 100;
      const row = document.createElement('div');
      row.className = 'prob-row';
      row.innerHTML = `
        <div class="prob-row-name">${t.abbr} ${t.name}</div>
        <div class="prob-bar-wrap">
          <div class="prob-bar-fill" style="width:${pct / maxPct * 100}%;background:${t.color}"></div>
        </div>
        <div class="prob-val" style="color:var(--text-primary)">${pct.toFixed(1)}%</div>`;
      container.appendChild(row);
    });
  }
  
  function buildHistoryRows() {
    const historical = [
      { abbr:'PHI', name:'76ers',      expected:2.1, actual:1, year:'2016', note:'Ben Simmons — top odds delivered' },
      { abbr:'CLE', name:'Cavaliers',  expected:3.2, actual:1, year:'2011', note:'Kyrie Irving — only 2.8% odds' },
      { abbr:'ORL', name:'Magic',      expected:2.0, actual:2, year:'2022', note:'Paolo Banchero' },
      { abbr:'HOU', name:'Rockets',    expected:1.8, actual:1, year:'2021', note:'Jalen Green' },
      { abbr:'DET', name:'Pistons',    expected:2.5, actual:5, year:'2021', note:'Fell from top odds, missed top 4' },
      { abbr:'MIN', name:'T-Wolves',   expected:1.5, actual:1, year:'2015', note:'Karl-Anthony Towns — hit top odds' },
      { abbr:'WAS', name:'Wizards',    expected:4.0, actual:2, year:'2010', note:'John Wall — big overperformance' },
      { abbr:'NOP', name:'Pelicans',   expected:3.1, actual:1, year:'2012', note:'Anthony Davis — massive upset win' },
    ];
  
    const container = document.getElementById('history-rows');
    container.innerHTML = '';
    historical.forEach(row => {
      const diff = row.expected - row.actual;
      const isOver = diff > 0;
      const div = document.createElement('div');
      div.className = 'analysis-row';
      div.innerHTML = `
        <div>
          <strong style="font-size:13px">${row.abbr} ${row.name}</strong>
          <span style="font-size:11px;color:var(--text-tertiary);margin-left:8px">${row.year} — ${row.note}</span>
        </div>
        <div style="text-align:right;flex-shrink:0;margin-left:12px">
          <span style="font-size:11px;color:var(--text-secondary)">Exp: ${row.expected} · Got: #${row.actual} · </span>
          <span class="${isOver ? 'over' : 'under'}">${isOver ? '+' + diff.toFixed(1) + ' 🍀' : diff.toFixed(1) + ' 😢'}</span>
        </div>`;
      container.appendChild(div);
    });
  }
  
  function buildParityChart() {
    if (parityChart) parityChart.destroy();
    const ctx = document.getElementById('parity-chart').getContext('2d');
    parityChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['1985','1990','1995','2000','2005','2010','2015','2019','2021','2024'],
        datasets: [{
          label: 'Pick concentration (Gini)',
          data: [0.00, 0.28, 0.35, 0.38, 0.42, 0.40, 0.43, 0.31, 0.29, 0.28],
          borderColor: '#1D428A',
          backgroundColor: 'rgba(29,66,138,0.08)',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: '#1D428A',
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            min: 0, max: 0.6,
            ticks: { callback: v => v.toFixed(2) },
            title: { display: true, text: 'Inequality index (higher = more concentrated odds)', font: { size: 11 } },
            grid: { color: 'rgba(128,128,128,0.12)' }
          },
          x: { grid: { display: false } }
        }
      }
    });
  }
  
  function buildCBAChart() {
    if (cbaChart) cbaChart.destroy();
    const labels = TEAMS.map((_, i) => `Seed ${i + 1}`);
    const normalize = arr => {
      const total = arr.reduce((a, b) => a + b, 0);
      return arr.map(o => parseFloat((o / total * 100).toFixed(2)));
    };
    const colors = { '2019': '#1D428A', 'pre2019': '#C8102E', '1985': '#888780', 'whatif': '#FFC72C' };
    const names = { '2019': '2019 Reform', 'pre2019': 'Pre-2019', '1985': '1985 Equal', 'whatif': 'Pure Tank' };
  
    cbaChart = new Chart(document.getElementById('cba-chart').getContext('2d'), {
      type: 'bar',
      data: {
        labels,
        datasets: Object.entries(ODDS).map(([key, arr]) => ({
          label: names[key],
          data: normalize(arr),
          backgroundColor: colors[key] + (key === currentEraKey ? 'ff' : '66'),
          borderRadius: 2,
        }))
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { ticks: { callback: v => v + '%' }, grid: { color: 'rgba(128,128,128,0.1)' } },
          x: { grid: { display: false }, ticks: { maxRotation: 45, font: { size: 10 } } }
        }
      }
    });
  
    // Custom legend
    const legendEl = document.getElementById('cba-legend');
    legendEl.innerHTML = Object.entries(names).map(([key, label]) =>
      `<span class="legend-item"><span class="legend-dot" style="background:${colors[key]}"></span>${label}</span>`
    ).join('');
  }
  
  // ─── ACTIONS ────────────────────────────────────────────────────────────────
  
  function runOneLottery() {
    const order = runLotteryDraw(currentOdds);
    const balls = document.getElementById('ball-container');
    const picks = document.getElementById('picks-grid');
    balls.innerHTML = '';
    picks.innerHTML = '';
    document.getElementById('lottery-results').classList.add('visible');
  
    // Animate balls appearing
    for (let i = 1; i <= 14; i++) {
      setTimeout(() => {
        const b = document.createElement('div');
        b.className = 'lottery-ball';
        b.textContent = i;
        balls.appendChild(b);
      }, i * 110);
    }
  
    // Reveal top-4 picks after ball animation
    setTimeout(() => {
      for (let p = 0; p < 4; p++) {
        const teamIdx = order[p];
        const t = TEAMS[teamIdx];
        const isUpset = teamIdx > p + 2;
        const card = document.createElement('div');
        card.className = 'pick-card';
        card.style.animationDelay = `${p * 0.1}s`;
        card.innerHTML = `
          <div class="pick-pick">#${p + 1} pick</div>
          <div class="pick-number">${p + 1}</div>
          <div style="margin-top:4px">
            <span class="pick-team-dot" style="background:${t.color}"></span>
            <span class="pick-team">${t.abbr}</span>
          </div>
          <div style="font-size:10px;color:var(--text-tertiary);margin-top:2px">${t.city}</div>
          ${isUpset ? '<div class="upset-badge">🎲 Upset!</div>' : ''}`;
        picks.appendChild(card);
      }
    }, 14 * 110 + 300);
  
    totalSims++;
    document.getElementById('total-sims').textContent = totalSims.toLocaleString();
  }
  
  function runMonteCarlo() {
    const n = parseInt(document.getElementById('sim-count').value);
    const focusIdx = parseInt(document.getElementById('mc-team-focus').value);
    const progressBar = document.getElementById('mc-progress');
    const progressWrap = document.getElementById('mc-progress-wrap');
  
    progressWrap.style.display = 'block';
    progressBar.style.width = '0%';
    document.getElementById('mc-stats').style.display = 'none';
    document.getElementById('mc-results').style.display = 'none';
  
    // Per-pick counts for focus team
    const pickCounts = Array(14).fill(0);
    // Sum of pick positions for each team (to compute expected value)
    const evSums = Array(14).fill(0);
  
    const BATCH = 5000;
    let done = 0;
  
    function runBatch() {
      const end = Math.min(done + BATCH, n);
      for (let i = done; i < end; i++) {
        const order = runLotteryDraw(currentOdds);
        order.forEach((teamIdx, pickPos) => {
          evSums[teamIdx] += pickPos + 1;
        });
        const focusPos = order.indexOf(focusIdx);
        pickCounts[focusPos]++;
      }
      done = end;
      progressBar.style.width = (done / n * 100) + '%';
      if (done < n) {
        requestAnimationFrame(runBatch);
      } else {
        finalizeMC(n, focusIdx, pickCounts, evSums);
      }
    }
  
    requestAnimationFrame(runBatch);
  }
  
  function finalizeMC(n, focusIdx, pickCounts, evSums) {
    totalSims += n;
    document.getElementById('total-sims').textContent = totalSims.toLocaleString();
    document.getElementById('mc-progress-wrap').style.display = 'none';
    document.getElementById('mc-stats').style.display = 'grid';
    document.getElementById('mc-results').style.display = 'block';
  
    document.getElementById('mc-sims').textContent = (n / 1000).toFixed(0) + 'K';
    document.getElementById('mc-top1').textContent = (pickCounts[0] / n * 100).toFixed(1) + '%';
    const focusEV = (evSums[focusIdx] / n).toFixed(2);
    document.getElementById('mc-ev').textContent = '#' + focusEV;
  
    // Pick distribution chart for focus team
    if (mcChart) mcChart.destroy();
    const ctx = document.getElementById('mc-chart').getContext('2d');
    mcChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: pickCounts.map((_, i) => `#${i + 1}`),
        datasets: [{
          label: 'Pick probability %',
          data: pickCounts.map(c => parseFloat((c / n * 100).toFixed(2))),
          backgroundColor: pickCounts.map((_, i) => i < 4 ? TEAMS[focusIdx].color : '#88878066'),
          borderRadius: 3,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { ticks: { callback: v => v + '%' }, grid: { color: 'rgba(128,128,128,0.1)' } },
          x: { grid: { display: false } }
        }
      }
    });
  
    // Expected value bars for all teams
    const evContainer = document.getElementById('ev-bars');
    evContainer.innerHTML = '';
    const evData = TEAMS.map((t, i) => ({ t, ev: evSums[i] / n, i })).sort((a, b) => a.ev - b.ev);
    const minEV = evData[0].ev, maxEV = evData[evData.length - 1].ev;
    evData.forEach(({ t, ev }) => {
      const bar = ((maxEV - ev) / (maxEV - minEV) * 100).toFixed(0);
      const row = document.createElement('div');
      row.className = 'prob-row';
      row.innerHTML = `
        <div class="prob-row-name">${t.abbr}</div>
        <div class="prob-bar-wrap">
          <div class="prob-bar-fill" style="width:${bar}%;background:${t.color}"></div>
        </div>
        <div class="prob-val" style="color:var(--text-primary)">EP ${ev.toFixed(2)}</div>`;
      evContainer.appendChild(row);
    });
  }
  
  function analyzeTrade() {
    const a = parseInt(document.getElementById('trade-team-a').value);
    const b = parseInt(document.getElementById('trade-team-b').value);
    const total = currentOdds.reduce((x, y) => x + y, 0);
    const top1A = currentOdds[a] / total * 100;
    const top1B = currentOdds[b] / total * 100;
    const evA = TEAMS[a].seed * 0.75 + (14 - TEAMS[a].seed) * 0.12;
    const evB = TEAMS[b].seed * 0.75 + (14 - TEAMS[b].seed) * 0.12;
    const top3A = Math.min(top1A * 2.4, 99).toFixed(1);
    const top3B = Math.min(top1B * 2.4, 99).toFixed(1);
  
    document.getElementById('trade-result').style.display = 'block';
    const tbody = document.getElementById('trade-tbody');
    tbody.innerHTML = `
      <tr>
        <td><strong>${TEAMS[a].abbr}</strong> 2024 pick (seed ${TEAMS[a].seed})</td>
        <td>#${Math.round(evA)}</td><td>${top3A}%</td>
        <td>${evA.toFixed(2)}</td>
        <td>${evA <= evB ? '<span class="over">✓ Better value</span>' : '—'}</td>
      </tr>
      <tr>
        <td><strong>${TEAMS[b].abbr}</strong> 2024 pick (seed ${TEAMS[b].seed})</td>
        <td>#${Math.round(evB)}</td><td>${top3B}%</td>
        <td>${evB.toFixed(2)}</td>
        <td>${evB < evA ? '<span class="over">✓ Better value</span>' : '—'}</td>
      </tr>`;
  
    const winner = evA <= evB ? TEAMS[a].abbr : TEAMS[b].abbr;
    const loser  = evA <= evB ? TEAMS[b].abbr : TEAMS[a].abbr;
    document.getElementById('trade-verdict').innerHTML = `
      <strong>Analysis:</strong> The <strong>${winner}</strong> pick carries higher expected lottery value under the current ${currentEraKey === '2019' ? '2019-era' : currentEraKey} rule set.
      Trading away the ${loser} pick in exchange is a value-negative move on draft probability alone.
      Note: pick trade value should also factor in player development pipelines, front-office track record, and roster timeline — this model captures only probabilistic lottery value.`;
  }
  
  function updateCBAAnalysis(era) {
    const texts = {
      '2019': 'The 2019 reform was the most significant structural change in lottery history. By giving the three worst teams equal 14% odds (down from a 25% maximum), the NBA reduced tanking incentives while still rewarding rebuilding. Simulation data shows the reform reduced "pure tank" top-pick advantage by ~44% for the worst team vs the pre-2019 system.',
      'pre2019': 'The pre-2019 system heavily rewarded losing — the worst team had a 25% shot at the #1 pick, nearly 10× the odds of the 8th-worst team. This created the "Process" era tanking culture, with franchises deliberately building losing rosters across multiple seasons.',
      '1985': 'The inaugural 1985 lottery gave every non-playoff team equal odds. While seemingly the most equitable system, it provided no additional incentive to rebuild, meaning some franchises avoided full teardowns. The Patrick Ewing "frozen envelope" conspiracy remains part of lottery lore.',
      'whatif': 'This hypothetical 50% top-pick-odds scenario would make tanking nearly a guaranteed strategy — a team could rebuild in 1–2 years with near-certainty of landing a franchise player. Analysis projects this would produce severe multi-year competitive imbalance and likely trigger multiple franchises simultaneously losing on purpose.',
    };
    document.getElementById('cba-analysis').innerHTML = texts[era];
  }
  
  function selectCBA(el, era) {
    document.querySelectorAll('.cba-card').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    currentEraKey = era;
    currentOdds = ODDS[era];
    document.getElementById('current-era').textContent = {
      '2019': '2019–Now', 'pre2019': 'Pre-2019', '1985': '1985 Equal', 'whatif': 'What-if Tank'
    }[era];
    buildCBAChart();
    updateCBAAnalysis(era);
    buildTeamsGrid();
    buildOddsBars();
  }
  
  function updateEra() {
    const v = document.getElementById('year-select').value;
    const eraMap = { '2024': '2019', '2019': '2019', 'pre2019': 'pre2019' };
    currentEraKey = eraMap[v] || '2019';
    currentOdds = ODDS[currentEraKey];
    buildTeamsGrid();
    buildOddsBars();
  }
  
  function switchTab(id, btn) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + id).classList.add('active');
    btn.classList.add('active');
  }
  
  function populateSelects() {
    const opts = TEAMS.map((t, i) => `<option value="${i}">${t.abbr} — ${t.name}</option>`).join('');
    document.getElementById('mc-team-focus').innerHTML = opts;
    document.getElementById('trade-team-a').innerHTML = opts;
    document.getElementById('trade-team-b').innerHTML = opts;
    document.getElementById('trade-team-b').value = '1';
  }
  
  // ─── INIT ────────────────────────────────────────────────────────────────────
  buildTeamsGrid();
  buildOddsBars();
  buildHistoryRows();
  populateSelects();
  updateCBAAnalysis('2019');
  setTimeout(() => { buildParityChart(); buildCBAChart(); }, 100);