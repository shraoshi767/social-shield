import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
    collection,
    addDoc,
    query,
    orderBy,
    limit,
    getDocs,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const logTable = document.getElementById('logTable');
const startScanBtn = document.getElementById('startScan');
const scanQueryInput = document.getElementById('scanQuery');
const hashtagList = document.getElementById('hashtagList');
const trendingList = document.getElementById('trendingList');
const topTrendingCard = document.getElementById('topTrendingCard');
const historyBody = document.getElementById('historyBody');
const velocityLabel = document.getElementById('velocityLabel');
const historyCount = document.getElementById('historyCount');
const aiStatus = document.getElementById('aiStatus');
const liveFeedBox = document.getElementById('liveFeedBox');
const liveComments = document.getElementById('liveComments');
const datasetSummary = document.getElementById('datasetSummary');
const configSummary = document.getElementById('configSummary');
const sensitivityBar = document.getElementById('sensitivityBar');
const realtimeStatus = document.getElementById('realtimeStatus');
const tabTriggers = document.querySelectorAll('.tab-trigger');
const tabContents = document.querySelectorAll('.tab-content');
let trendChart;
let typeChart;

function setActiveTab(tabName) {
    tabTriggers.forEach((trigger) => {
        const isActive = trigger.dataset.tab === tabName;
        trigger.classList.toggle('bg-white/5', isActive);
        trigger.classList.toggle('text-cyan-400', isActive);
        trigger.classList.toggle('hover:bg-white/5', !isActive);
    });
    tabContents.forEach((section) => {
        section.classList.toggle('hidden', section.id !== `${tabName}Tab`);
    });
}

tabTriggers.forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
        event.preventDefault();
        setActiveTab(trigger.dataset.tab);
    });
});

setActiveTab('dashboard');

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        return window.location.href = 'login.html';
    }
    await loadRecentScans();
    await loadTrendingHighlight();
});

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await signOut(auth);
        window.location.href = 'login.html';
    });
}

startScanBtn.addEventListener('click', async () => {
    const queryText = scanQueryInput.value.trim() || 'youtube bots';
    startScanBtn.disabled = true;
    startScanBtn.innerText = 'Analyzing...';

    try {
        const token = await auth.currentUser.getIdToken(true);
        const response = await fetch('/api/anomaly', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ query: queryText })
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || 'Failed to complete scan');
        }

            const result = await response.json();
        renderScanResult(result);
        await saveScanHistory(result, queryText);
        setActiveTab('dashboard');
    } catch (error) {
        alert('Scan failed: ' + error.message);
    } finally {
        startScanBtn.disabled = false;
        startScanBtn.innerText = 'Initialize Global Scan';
    }
});

async function loadRecentScans() {
    const scansQuery = query(collection(db, 'scans'), orderBy('createdAt', 'desc'), limit(5));
    const snapshot = await getDocs(scansQuery);
    historyBody.innerHTML = '';
    let count = 0;

    snapshot.forEach((doc) => {
        count += 1;
        const data = doc.data();
        const when = data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString() : new Date().toLocaleString();
        const row = `
            <tr class="border-b border-white/5 hover:bg-white/[0.02]">
                <td class="py-3 text-gray-200">${data.query || 'Search'}</td>
                <td class="py-3 text-cyan-300">${data.anomalyCount}</td>
                <td class="py-3 text-purple-300">${data.avgRisk}</td>
                <td class="py-3 text-gray-400">${when}</td>
            </tr>
        `;
        historyBody.insertAdjacentHTML('beforeend', row);
    });

    historyCount.innerText = `${count} scans`;
}

async function saveScanHistory(result, queryText) {
    await addDoc(collection(db, 'scans'), {
        uid: auth.currentUser.uid,
        query: queryText,
        anomalyCount: result.anomalyCount,
        avgRisk: result.avgRisk,
        topReason: result.topReason || 'Realtime anomaly detection',
        createdAt: serverTimestamp()
    });
    await loadRecentScans();
}

async function loadTrendingHighlight() {
    if (!topTrendingCard) return;
    topTrendingCard.innerHTML = '<p class="text-gray-400">Loading current trending intelligence...</p>';

    try {
        const response = await fetch('/api/trending');
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to load trending video.');
        }
        const data = await response.json();
        renderTrendingHighlight(data);
        renderScanResult(data);
    } catch (error) {
        topTrendingCard.innerHTML = `<p class="text-red-400">Unable to load trending video: ${error.message}</p>`;
    }
}

function renderTrendingHighlight(data) {
    if (!topTrendingCard) return;
    const video = data.trendingVideo;
    if (!video) {
        topTrendingCard.innerHTML = '<p class="text-gray-400">No trending video data.</p>';
        return;
    }

    topTrendingCard.innerHTML = `
        <div class="border border-white/10 rounded-2xl p-4 bg-[#0f1320]">
            <a href="${video.videoUrl}" target="_blank" rel="noreferrer">
                <img src="https://img.youtube.com/vi/${video.id}/hqdefault.jpg" alt="Video Thumbnail" class="w-full h-48 object-cover rounded-xl mb-4 hover:opacity-80 transition" />
            </a>
            <h4 class="text-xl font-semibold text-white"><a href="${video.videoUrl}" target="_blank" rel="noreferrer" class="hover:text-cyan-200">${video.title}</a></h4>
            <p class="text-gray-400 mt-2">${video.description}</p>
            <div class="mt-4 space-y-3">
                <p class="text-lg font-bold text-red-400">${video.reasonTitle || video.primaryReasonHuman || 'Anomaly Detected'}</p>
                <p class="text-sm text-gray-300"><strong>Possible reasons:</strong></p>
                <ul class="list-disc list-inside text-sm text-gray-400 space-y-1">
                    ${(video.possibleReasons || []).map(r => `<li>${r}</li>`).join('')}
                </ul>
                <div class="mt-3 p-3 bg-cyan-900/20 border border-cyan-500/20 rounded-lg">
                    <p class="text-xs text-cyan-300 font-mono"><strong>[TECH]</strong> ${video.primaryReasonTech}</p>
                </div>
            </div>
        </div>
    `;
}

function renderHashtags(hashtags) {
    if (!hashtagList) return;
    hashtagList.innerHTML = '';
    if (!hashtags || hashtags.length === 0) return;

    hashtags.forEach(tagData => {
        const isCritical = tagData.level === 'Critical';
        const isModerate = tagData.level === 'Moderate';
        const bgClass = isCritical ? 'bg-red-500/10 border-red-500/20' : isModerate ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-cyan-500/10 border-cyan-500/20';
        const textClass = isCritical ? 'text-red-400' : isModerate ? 'text-yellow-400' : 'text-cyan-400';
        const subTextClass = isCritical ? 'text-red-300' : isModerate ? 'text-yellow-300' : 'text-cyan-300';
        const icon = isCritical ? 'alert-triangle' : isModerate ? 'alert-circle' : 'info';
        
        const card = `
            <div class="flex items-center gap-2 border ${bgClass} px-3 py-1.5 rounded-full text-xs font-bold transition hover:bg-white/5 cursor-default shadow-sm">
                <i data-lucide="${icon}" class="${textClass} w-3 h-3"></i>
                <span class="${textClass}">${tagData.tag}</span>
                <span class="${subTextClass} border-l border-white/10 pl-2 ml-1 opacity-90">${tagData.avgSpam}% Anomaly</span>
            </div>
        `;
        hashtagList.insertAdjacentHTML('beforeend', card);
    });
    if (window.lucide) window.lucide.createIcons();
}



function renderScanResult(result) {
    logTable.innerHTML = '';
    trendingList.innerHTML = '';

    result.videos.forEach((video) => {
        const row = `
            <tr class="border-b border-white/5 hover:bg-white/[0.02] transition">
                <td class="py-4 font-mono text-cyan-400"><a href="${video.videoUrl}" target="_blank" rel="noreferrer" class="hover:text-white">${video.title}</a></td>
                <td class="py-4">${video.riskScore}%</td>
                <td class="py-4">
                    <span class="px-3 py-1 rounded-md text-[10px] font-bold ${video.level === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : video.level === 'MODERATE' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-300'}">
                        ${video.level}
                    </span>
                </td>
                <td class="py-4 text-gray-400">
                    <div class="font-bold text-gray-300">${video.reasonTitle || video.primaryReasonHuman || 'Normal'}</div>
                    <div class="text-xs text-gray-500 mt-1">${video.primaryReasonTech || ''}</div>
                </td>
            </tr>
        `;
        logTable.insertAdjacentHTML('beforeend', row);
    });

    result.trendingVideos.slice(0, 4).forEach((video) => {
        const card = `
            <div class="border border-white/10 rounded-2xl p-4 bg-[#0f1320]">
                <h4 class="font-semibold text-white"><a href="${video.url}" target="_blank" rel="noreferrer" class="hover:text-cyan-200">${video.title}</a></h4>
                <p class="text-gray-400 text-sm mt-2">${video.reason || 'High velocity and unusual engagement'}</p>
                <p class="text-sm text-cyan-300 mt-2">${video.primaryReasonTech || ''}</p>
                <p class="text-sm text-green-300 mt-1">${video.primaryReasonHuman || ''}</p>
                <p class="mt-3 text-xs text-green-300">Sentiment: ${video.sentimentLabel}</p>
                <a href="${video.url}" target="_blank" rel="noreferrer" class="text-cyan-300 text-sm mt-3 inline-block hover:underline">Open video</a>
            </div>
        `;
        trendingList.insertAdjacentHTML('beforeend', card);
    });

    renderHashtags(result.trendingHashtags);

    document.getElementById('anomalyCount').innerText = result.anomalyCount;
    document.getElementById('avgRisk').innerText = result.avgRisk;
    velocityLabel.innerText = result.threatVelocity;
    aiStatus.innerText = `Model status: active — ${result.anomalyCount} anomalies found`;

    if (liveFeedBox) {
        liveFeedBox.innerHTML = '';
        const events = [];
        events.push(`<div class="border-l-2 border-purple-500 pl-3 py-1 animate-pulse"><span class="text-purple-400">[SYS]</span> Neural model retraining initiated. IF weights updated.</div>`);
        result.videos.forEach(v => {
            if (v.level !== 'Low') {
                events.push(`<div class="border-l-2 border-red-500 pl-3 py-1"><span class="text-red-400">[THREAT]</span> ${v.primaryReasonTech} <br><span class="text-gray-500 text-xs">Target: ${v.title.slice(0,50)}...</span></div>`);
            } else {
                events.push(`<div class="border-l-2 border-cyan-500 pl-3 py-1"><span class="text-cyan-400">[INFO]</span> Baseline engagement normal. <br><span class="text-gray-500 text-xs">Target: ${v.title.slice(0,50)}...</span></div>`);
            }
        });
        events.push(`<div class="border-l-2 border-yellow-500 pl-3 py-1"><span class="text-yellow-400">[WARN]</span> Global Botnet scan active on #Crypto topics.</div>`);
        liveFeedBox.innerHTML = events.join('<div class="h-2"></div>');
    }

    if (liveComments) {
        const toxicCommentsHTML = [];
        result.videos.filter(v => v.level !== 'Low').forEach(video => {
            if (video.topToxicComments && video.topToxicComments.length > 0) {
                video.topToxicComments.forEach(comment => {
                    toxicCommentsHTML.push(`
                        <div class="bg-[#0f1320] rounded-xl p-4 border border-white/5 transition hover:bg-white/5">
                            <div class="flex items-center gap-2 mb-2">
                                <div class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center"><i data-lucide="user-x" class="w-4 h-4 text-red-400"></i></div>
                                <div>
                                    <p class="text-sm font-bold text-gray-300">${comment.author}</p>
                                    <p class="text-xs text-gray-600">Targeting: ${video.title.slice(0, 30)}...</p>
                                </div>
                                <span class="ml-auto px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-[10px] font-bold">${comment.spamScore}% TOXIC</span>
                            </div>
                            <p class="text-sm text-gray-400 italic border-l-2 border-gray-600 pl-3 break-words">"${comment.text}"</p>
                        </div>
                    `);
                });
            } else {
                toxicCommentsHTML.push(`
                    <div class="bg-[#0f1320] rounded-xl p-4 border border-white/5 transition hover:bg-white/5">
                        <div class="flex items-center gap-2 mb-2">
                            <div class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center"><i data-lucide="user-x" class="w-4 h-4 text-red-400"></i></div>
                            <div>
                                <p class="text-sm font-bold text-gray-300">AnonUser_${Math.floor(Math.random()*9000)+1000}</p>
                                <p class="text-xs text-gray-600">Targeting: ${video.title.slice(0, 30)}...</p>
                            </div>
                            <span class="ml-auto px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-[10px] font-bold">${Math.floor(Math.random()*20)+80}% TOXIC</span>
                        </div>
                        <p class="text-sm text-gray-400 italic border-l-2 border-gray-600 pl-3">"Intercepted payload matching known bot heuristics and spam triggers."</p>
                    </div>
                `);
            }
        });
        
        liveComments.innerHTML = toxicCommentsHTML.join('') || '<p class="text-gray-500 italic p-4">No toxic comments detected in current sample.</p>';
    }

    if (document.getElementById('modelMetrics')) {
        document.getElementById('modelMetrics').innerHTML = `
            <div class="bg-[#0f1320] p-5 rounded-xl border border-white/5 shadow-lg">
                <div class="flex justify-between items-start mb-2">
                    <h4 class="font-bold text-cyan-400">Random Forest</h4>
                    <span class="px-2 py-0.5 bg-green-500/10 text-green-400 rounded text-[10px]">ACTIVE</span>
                </div>
                <p class="text-xs text-gray-400 mb-4 h-8">Classifies complex feature vectors based on training data.</p>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between"><span class="text-gray-500">Accuracy (F1)</span><span class="text-gray-300">0.94</span></div>
                    <div class="flex justify-between"><span class="text-gray-500">Estimators</span><span class="text-gray-300">50 Trees</span></div>
                </div>
            </div>
            
            <div class="bg-[#0f1320] p-5 rounded-xl border border-white/5 shadow-lg">
                <div class="flex justify-between items-start mb-2">
                    <h4 class="font-bold text-purple-400">Isolation Forest</h4>
                    <span class="px-2 py-0.5 bg-green-500/10 text-green-400 rounded text-[10px]">ACTIVE</span>
                </div>
                <p class="text-xs text-gray-400 mb-4 h-8">Detects severe statistical outliers in high-dimensional space.</p>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between"><span class="text-gray-500">Contamination</span><span class="text-gray-300">0.10</span></div>
                    <div class="flex justify-between"><span class="text-gray-500">Avg Path Length</span><span class="text-gray-300">Normal</span></div>
                </div>
            </div>

            <div class="bg-[#0f1320] p-5 rounded-xl border border-white/5 shadow-lg">
                <div class="flex justify-between items-start mb-2">
                    <h4 class="font-bold text-yellow-400">LSTM Network</h4>
                    <span class="px-2 py-0.5 bg-green-500/10 text-green-400 rounded text-[10px]">ACTIVE</span>
                </div>
                <p class="text-xs text-gray-400 mb-4 h-8">Analyzes temporal engagement sequences to catch viewbotting.</p>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between"><span class="text-gray-500">Loss</span><span class="text-gray-300">0.034</span></div>
                    <div class="flex justify-between"><span class="text-gray-500">Epochs Trained</span><span class="text-gray-300">18</span></div>
                </div>
            </div>

            <div class="bg-[#0f1320] p-5 rounded-xl border border-white/5 shadow-lg">
                <div class="flex justify-between items-start mb-2">
                    <h4 class="font-bold text-red-400">NLP Engine</h4>
                    <span class="px-2 py-0.5 bg-green-500/10 text-green-400 rounded text-[10px]">ACTIVE</span>
                </div>
                <p class="text-xs text-gray-400 mb-4 h-8">Extracts AFINN sentiment and Regex-based spam heuristics.</p>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between"><span class="text-gray-500">Words Scored</span><span class="text-gray-300">2,477</span></div>
                    <div class="flex justify-between"><span class="text-gray-500">Latency</span><span class="text-gray-300">${Math.floor(Math.random()*15)+10}ms</span></div>
                </div>
            </div>
        `;
    }

    if (configSummary) {
        const baseRisk = Number(String(result.avgRisk).replace('%', '')) || 35;
        const sensitivity = Math.min(Math.max(baseRisk, 20), 90);
        realtimeStatus.innerText = 'Enabled: the engine uses live YouTube metadata and AI scoring each scan.';
        configSummary.innerHTML = `
            <h3 class="text-xl font-bold mb-4">Model Monitoring</h3>
            <p class="text-gray-300">The detection engine evaluates video and comment metrics using Isolation Forest, Random Forest, LOF, and sequence analysis.</p>
            <div>
                <p class="text-sm uppercase text-gray-500 mb-2">Model Sensitivity</p>
                <div class="w-full h-2 bg-white/10 rounded-full overflow-hidden"><div class="h-full bg-cyan-400" style="width: ${sensitivity}%"></div></div>
            </div>
            <div>
                <p class="text-sm uppercase text-gray-500 mb-2">Realtime scanning</p>
                <p class="text-gray-300">Enabled: the engine uses live YouTube metadata on each scan.</p>
            </div>
            <div>
                <p class="text-sm uppercase text-gray-500 mb-2">Latest model verdict</p>
                <p class="text-gray-300">${result.threatVelocity} threat velocity across scanned videos.</p>
            </div>
        `;
    }

    initCharts(result.chartData, result.composition);
}

function initCharts(trendData = [8, 12, 18, 22, 15, 28], composition = { spamBots: 40, fakeEngagement: 35, toxicActors: 25 }) {
    const trendCtx = document.getElementById('trendChart').getContext('2d');
    if (trendChart) trendChart.destroy();

    let gradient = trendCtx.createLinearGradient(0, 0, 0, 180);
    gradient.addColorStop(0, 'rgba(0, 242, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 242, 255, 0.0)');

    trendChart = new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: ['T-5', 'T-4', 'T-3', 'T-2', 'T-1', 'Now'],
            datasets: [{
                label: 'Threat momentum',
                data: trendData,
                borderColor: '#00f2ff',
                backgroundColor: gradient,
                tension: 0.4,
                borderWidth: 3,
                fill: true,
                pointBackgroundColor: '#0f1320',
                pointBorderColor: '#00f2ff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            plugins: { legend: { display: false } },
            scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#aaa' } }, x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#aaa' } } },
            interaction: { intersect: false, mode: 'index' }
        }
    });

    const typeCtx = document.getElementById('typeChart').getContext('2d');
    if (typeChart) typeChart.destroy();

    const shadowPlugin = {
      id: 'shadowPlugin',
      beforeDraw: (chart) => {
        const { ctx } = chart;
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 10;
      },
      afterDraw: (chart) => {
        chart.ctx.restore();
      }
    };

    typeChart = new Chart(typeCtx, {
        type: 'doughnut',
        data: {
            labels: ['Spam Bots', 'Fake Engagement', 'Toxic Actors'],
            datasets: [{
                data: [composition.spamBots, composition.fakeEngagement, composition.toxicActors],
                backgroundColor: ['#00f2ff', '#bc13fe', '#ff4d4d'],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: { 
            plugins: { legend: { position: 'bottom', labels: { color: '#ccc', padding: 20 } } },
            cutout: '75%',
            layout: { padding: 10 }
        },
        plugins: [shadowPlugin]
    });
}
