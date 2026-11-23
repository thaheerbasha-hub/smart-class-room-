/**
 * LearnSmart - Smart Interactive Classroom System
 * Core Application Logic, Reactive Store, and Multi-role Real-time Sync
 */

// Initial State Schema & Mock Seed
const DEFAULT_STATE = {
  role: 'student', // 'student' | 'teacher'
  isOffline: false,
  room: {
    code: 'CS-204',
    title: 'Distributed Systems & Cloud Computing',
    topic: 'Lecture 14: Raft Consensus, Quorums & Fault Tolerance',
    instructor: 'Prof. Aris Thorne',
    schedule: '10:00 AM - 11:30 AM',
    enrolledCount: 48,
    activeCount: 42
  },
  checklist: [
    { id: 'goal-1', text: 'Read Chapter 4.2 notes on State Machine Replication', checked: true },
    { id: 'goal-2', text: 'Review previous quiz on Two-Phase Commit (2PC) guarantees', checked: false },
    { id: 'goal-3', text: 'Download today\'s Raft cheat-sheet & starter code repository', checked: false }
  ],
  doubts: [
    {
      id: 'd-101',
      topic: 'Leader Election',
      question: 'Why do consensus protocols like Raft strictly require an odd number of servers (e.g., 3, 5, 7) instead of an even number?',
      upvotes: 16,
      status: 'answered',
      answerText: 'Great question! An odd cluster (e.g., 5 nodes) tolerates 2 failures (needs 3 for quorum). A 6-node cluster also tolerates only 2 failures (needs 4 for quorum) but requires an extra ACK and introduces 3-3 tie risks. Odd nodes maximize fault tolerance per server.',
      createdAt: '15 mins ago',
      pinned: true,
      userUpvoted: true
    },
    {
      id: 'd-102',
      topic: 'Split-Brain',
      question: 'If a network partition isolates the leader with only 1 follower in a 5-node cluster, can it still commit new write operations to disk?',
      upvotes: 11,
      status: 'pending',
      answerText: '',
      createdAt: '8 mins ago',
      pinned: false,
      userUpvoted: false
    },
    {
      id: 'd-103',
      topic: 'Heartbeat Timers',
      question: 'How does Raft ensure two candidate nodes do not split votes indefinitely during simultaneous election timeouts?',
      upvotes: 22,
      status: 'answered',
      answerText: 'Raft uses randomized election timeouts (e.g. 150ms-300ms) for each node. This breaks symmetry: one candidate almost always times out first, gathers majority votes, and asserts leadership before peers wake up.',
      createdAt: '25 mins ago',
      pinned: false,
      userUpvoted: false
    },
    {
      id: 'd-104',
      topic: 'Quorum Math',
      question: 'What is the exact mathematical condition for quorum in a partition with n=7 nodes when 3 nodes crash?',
      upvotes: 7,
      status: 'pending',
      answerText: '',
      createdAt: '3 mins ago',
      pinned: false,
      userUpvoted: false
    }
  ],
  quiz: {
    title: 'Live Pop Quiz: Raft & Distributed Consensus',
    questions: [
      {
        id: 1,
        topic: 'Quorum Math',
        prompt: 'Why do consensus protocols like Raft typically operate with an odd number of cluster nodes (3, 5, 7)?',
        options: [
          'To reduce overall cluster power consumption by 50%',
          'To guarantee a strict majority quorum (⌊n/2⌋ + 1) without tie-breaking deadlocks',
          'Because cloud VM instances are priced cheaper in odd numbers',
          'To satisfy SHA-256 cryptographic alignment constraints'
        ],
        correctIndex: 1,
        explanation: 'With n nodes, quorum requires ⌊n/2⌋ + 1. An odd cluster (5 nodes) tolerates 2 failures (5 - 3 = 2). A 6-node cluster ALSO tolerates only 2 failures (6 - 4 = 2) while adding network overhead and 3-3 split vote deadlocks.'
      },
      {
        id: 2,
        topic: 'Heartbeat Timers',
        prompt: 'When an active Raft follower detects that its randomized election timeout expired without receiving an AppendEntries RPC, what does it do next?',
        options: [
          'It immediately powers down to prevent uncommitted log divergence',
          'It issues an emergency rollback request to the secondary database',
          'It increments its term counter, votes for itself, and broadcasts RequestVote RPCs',
          'It sends a 503 Service Unavailable alert to external web clients'
        ],
        correctIndex: 2,
        explanation: 'When election timeout expires, a follower assumes leader failure, increments its currentTerm, transitions to Candidate, votes for itself, and broadcasts RequestVote RPCs to all peers in parallel.'
      },
      {
        id: 3,
        topic: 'Log Replication',
        prompt: 'In Raft log replication, when is a log entry considered formally "committed" and safe to execute on the state machine?',
        options: [
          'Immediately after the leader writes it into volatile RAM cache',
          'Once it is acknowledged by an external load balancer',
          'Once replicated on a strict majority (quorum) of nodes during the current leader\'s term',
          'Only after the entire cluster is rebooted at midnight maintenance'
        ],
        correctIndex: 2,
        explanation: 'A log entry is committed once stored on a majority of nodes by the leader of the current term. The leader then updates its commitIndex and applies the entry to its state machine.'
      }
    ],
    userProgress: {
      currentIndex: 0,
      selectedAnswers: {}, // questionId -> optionIndex
      isSubmitted: false,
      score: 0,
      completedAt: null
    }
  },
  lessons: [
    {
      id: 'les-1',
      title: 'Raft Consensus Visualized: 3-Node Cluster Election',
      topic: 'Leader Election',
      duration: '3:15 min',
      badge: 'Core Concept',
      difficulty: 'Intermediate',
      summary: 'Dynamic visualization of follower election timeouts, RequestVote RPC broadcasts, term increments, and heartbeat pulses in a live 3-node cluster.',
      keyPoints: [
        'Nodes always initialize in Follower state awaiting leader heartbeats (150-300ms).',
        'Randomized timers break vote symmetry to avoid repetitive candidate stalemates.',
        'A candidate needs votes from a strict majority (≥ 2 out of 3 nodes) to declare leadership.',
        'The newly elected leader sends periodic empty AppendEntries heartbeats to suppress new elections.'
      ],
      offlineFile: 'LearnSmart_CS204_Raft_Cluster_Election.txt'
    },
    {
      id: 'les-2',
      title: 'Handling Network Partitions & Split-Brain Anomaly',
      topic: 'Split-Brain',
      duration: '2:45 min',
      badge: 'Exam Essential',
      difficulty: 'Advanced',
      summary: 'How Raft isolates minority network partitions and prevents double-write state divergence when routers fail.',
      keyPoints: [
        'A minority partition cannot reach quorum (e.g. 2 nodes cannot commit when 3 are needed in a 5-node cluster).',
        'The leader in the minority partition receives client requests but cannot commit or apply them.',
        'The majority partition elects a new leader with a higher term number and continues committing safely.',
        'Upon partition healing, the minority leader observes the higher term, steps down to follower, and adopts the majority log.'
      ],
      offlineFile: 'LearnSmart_CS204_Split_Brain_Safety.txt'
    },
    {
      id: 'les-3',
      title: 'Log Matching Property & State Machine Safety',
      topic: 'Log Replication',
      duration: '3:30 min',
      badge: 'High Yield',
      difficulty: 'Advanced',
      summary: 'Formal verification of the Log Matching invariant: if two entries have the same index and term, they hold identical commands.',
      keyPoints: [
        'AppendEntries consistency check verifies previous log index and term before accepting new entries.',
        'Followers reject divergent entries; the leader decrements nextIndex until reaching common consensus point.',
        'Leader never truncates or rewrites its own log entries; leader log is append-only.',
        'State Machine Safety ensures no two machines ever execute contradictory commands at index i.'
      ],
      offlineFile: 'LearnSmart_CS204_Log_Matching_Safety.txt'
    },
    {
      id: 'les-4',
      title: 'Quorum Mathematics & Fault Tolerance Matrix',
      topic: 'Quorum Math',
      duration: '2:20 min',
      badge: 'Quick Formulas',
      difficulty: 'Foundational',
      summary: 'Mathematical breakdown of quorum threshold Q = ⌊N/2⌋ + 1 and why even-numbered node clusters waste resources.',
      keyPoints: [
        'Quorum Formula: Q = floor(N / 2) + 1 for an N-node cluster.',
        'Fault Tolerance Formula: F = floor((N - 1) / 2) simultaneous crash failures tolerated.',
        'Cluster N=3: Quorum=2, Tolerates F=1 failure.',
        'Cluster N=5: Quorum=3, Tolerates F=2 failures.',
        'Cluster N=6: Quorum=4, Tolerates F=2 failures (requires extra server with zero extra fault tolerance).'
      ],
      offlineFile: 'LearnSmart_CS204_Quorum_Math_Matrix.txt'
    }
  ],
  stats: {
    quizSubmissions: 39,
    totalQuizScoreSum: 98, // out of 39 * 3 = 117 => ~83.7%
    downloadsCount: 52,
    topicComprehension: {
      'Leader Election': 88,
      'Quorum Math': 79,
      'Log Replication': 85,
      'Split-Brain': 74,
      'Heartbeat Timers': 91
    }
  },
  activeBroadcast: null // Pop quiz alert from teacher
};

// Central Store Manager with Cross-tab BroadcastChannel
class LearnSmartStore {
  constructor() {
    this.storageKey = 'learnsmart_classroom_state_v1';
    this.broadcastChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('learnsmart_sync') : null;
    this.subscribers = new Set();
    this.state = this.loadState();

    if (this.broadcastChannel) {
      this.broadcastChannel.onmessage = (event) => {
        if (event.data && event.data.type === 'STATE_SYNC') {
          this.state = event.data.state;
          this.notify(false); // Don't re-broadcast
        }
      };
    }

    // Also listen to storage events for cross-tab support
    window.addEventListener('storage', (e) => {
      if (e.key === this.storageKey && e.newValue) {
        try {
          this.state = JSON.parse(e.newValue);
          this.notify(false);
        } catch (err) {
          console.error('Storage sync error:', err);
        }
      }
    });
  }

  loadState() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure defaults are present in case schema was updated
        return { ...DEFAULT_STATE, ...parsed };
      }
    } catch (e) {
      console.warn('Could not parse localStorage, using default state.', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  saveState(broadcast = true) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save state to localStorage:', e);
    }
    if (broadcast && this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'STATE_SYNC',
        state: this.state
      });
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify(broadcast = true) {
    this.saveState(broadcast);
    this.subscribers.forEach((cb) => {
      try {
        cb(this.state);
      } catch (err) {
        console.error('Subscriber notification error:', err);
      }
    });
  }

  // --- Actions ---

  setRole(role) {
    this.state.role = role;
    this.notify();
  }

  toggleOffline() {
    this.state.isOffline = !this.state.isOffline;
    this.notify();
    return this.state.isOffline;
  }

  toggleChecklist(id) {
    const item = this.state.checklist.find((c) => c.id === id);
    if (item) {
      item.checked = !item.checked;
      this.notify();
    }
  }

  addDoubt(topic, question) {
    const newDoubt = {
      id: 'd-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      topic: topic || 'General Inquiry',
      question: question.trim(),
      upvotes: 1,
      status: 'pending',
      answerText: '',
      createdAt: 'Just now',
      pinned: false,
      userUpvoted: true
    };
    this.state.doubts.unshift(newDoubt);
    this.notify();
    return newDoubt;
  }

  toggleUpvote(id) {
    const doubt = this.state.doubts.find((d) => d.id === id);
    if (!doubt) return;
    if (doubt.userUpvoted) {
      doubt.upvotes = Math.max(0, doubt.upvotes - 1);
      doubt.userUpvoted = false;
    } else {
      doubt.upvotes += 1;
      doubt.userUpvoted = true;
    }
    this.notify();
  }

  resolveDoubt(id, answerText = '') {
    const doubt = this.state.doubts.find((d) => d.id === id);
    if (doubt) {
      doubt.status = 'answered';
      if (answerText && answerText.trim()) {
        doubt.answerText = answerText.trim();
      } else if (!doubt.answerText) {
        doubt.answerText = 'Addressed and clarified by Prof. Thorne during live lecture discussion.';
      }
      this.notify();
    }
  }

  togglePinDoubt(id) {
    const doubt = this.state.doubts.find((d) => d.id === id);
    if (doubt) {
      doubt.pinned = !doubt.pinned;
      this.notify();
    }
  }

  deleteDoubt(id) {
    this.state.doubts = this.state.doubts.filter((d) => d.id !== id);
    this.notify();
  }

  selectQuizAnswer(questionId, optionIndex) {
    this.state.quiz.userProgress.selectedAnswers[questionId] = optionIndex;
    this.notify();
  }

  setQuizCurrentIndex(index) {
    this.state.quiz.userProgress.currentIndex = index;
    this.notify();
  }

  submitQuiz() {
    let score = 0;
    const questions = this.state.quiz.questions;
    questions.forEach((q) => {
      const selected = this.state.quiz.userProgress.selectedAnswers[q.id];
      if (selected === q.correctIndex) {
        score++;
      }
    });

    this.state.quiz.userProgress.isSubmitted = true;
    this.state.quiz.userProgress.score = score;
    this.state.quiz.userProgress.completedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Update global teacher engagement statistics
    this.state.stats.quizSubmissions += 1;
    this.state.stats.totalQuizScoreSum += score;

    // Boost corresponding topic score in analytics
    questions.forEach((q) => {
      const selected = this.state.quiz.userProgress.selectedAnswers[q.id];
      const isCorrect = selected === q.correctIndex;
      if (this.state.stats.topicComprehension[q.topic] !== undefined) {
        const current = this.state.stats.topicComprehension[q.topic];
        const delta = isCorrect ? 2 : -2;
        this.state.stats.topicComprehension[q.topic] = Math.min(99, Math.max(50, current + delta));
      }
    });

    this.notify();
    return score;
  }

  resetQuiz() {
    this.state.quiz.userProgress = {
      currentIndex: 0,
      selectedAnswers: {},
      isSubmitted: false,
      score: 0,
      completedAt: null
    };
    this.notify();
  }

  recordDownload(lessonId) {
    this.state.stats.downloadsCount += 1;
    this.notify();
  }

  pushLiveQuizAnnouncement(title, message) {
    this.state.activeBroadcast = {
      id: 'bc-' + Date.now(),
      title: title || '⚡ Pop Quiz Alert from Prof. Thorne!',
      message: message || 'Please open the Live Short Quiz panel on your screen to complete the 3-question check.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    this.notify();
  }

  dismissBroadcast() {
    this.state.activeBroadcast = null;
    this.notify();
  }

  simulateCohortActivity() {
    // Generate simulated student cohort activity for demo
    const sampleQuestions = [
      { topic: 'Leader Election', q: 'What happens if two candidate nodes get an equal number of votes in a 4-node network partition?' },
      { topic: 'Log Replication', q: 'Can an uncommitted entry from a previous term be committed directly by a new leader?' },
      { topic: 'Quorum Math', q: 'If 2 servers out of 5 fail permanently, can the remaining 3 still process client transactions safely?' },
      { topic: 'Split-Brain', q: 'How does client redirection work when a client contacts an isolated old leader?' }
    ];

    const pick = sampleQuestions[Math.floor(Math.random() * sampleQuestions.length)];
    this.addDoubt(pick.topic, pick.q);

    // Increment submissions and randomize slightly
    this.state.stats.quizSubmissions += Math.floor(Math.random() * 3) + 2;
    this.state.stats.totalQuizScoreSum += Math.floor(Math.random() * 8) + 4;
    this.state.stats.downloadsCount += Math.floor(Math.random() * 4) + 1;

    for (let key in this.state.stats.topicComprehension) {
      const shift = (Math.random() * 6 - 2.5);
      this.state.stats.topicComprehension[key] = Math.round(Math.min(98, Math.max(55, this.state.stats.topicComprehension[key] + shift)));
    }

    this.notify();
  }

  resetDemoData() {
    this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.notify();
  }
}

// Sound Synthesizer using Web Audio API (Pleasant ambient audio cues)
class SoundFX {
  constructor() {
    this.ctx = null;
  }
  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  }
  playSuccess() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.22); // G5
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.36);
    } catch (e) {}
  }
  playNotification() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.14); // A5
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    } catch (e) {}
  }
}

// Toast Notification Manager
class ToastManager {
  constructor(containerId = 'toast-container') {
    this.container = document.getElementById(containerId);
  }

  show(title, message, type = 'info', duration = 4000) {
    if (!this.container) return;

    const toast = document.createElement('div');
    const colors = {
      info: 'bg-[#1E2D28] text-white border-l-4 border-[#84AF9B]',
      success: 'bg-[#1E2D28] text-white border-l-4 border-[#3B735B]',
      alert: 'bg-[#1E2D28] text-white border-l-4 border-[#FF4266]',
      offline: 'bg-[#EFECE4] text-[#1E2D28] border-l-4 border-[#D9264D] shadow-lg'
    };

    const icons = {
      info: 'info',
      success: 'check-circle-2',
      alert: 'bell-ring',
      offline: 'wifi-off'
    };

    toast.className = `flex items-start gap-3 p-4 rounded-xl shadow-xl transition-all duration-300 transform translate-y-2 opacity-0 max-w-md ${colors[type] || colors.info}`;
    toast.innerHTML = `
      <div class="mt-0.5 text-sage">
        <i data-lucide="${icons[type] || 'info'}" class="w-5 h-5"></i>
      </div>
      <div class="flex-1 text-sm">
        <p class="font-semibold text-sm leading-tight">${title}</p>
        ${message ? `<p class="mt-1 opacity-90 text-xs">${message}</p>` : ''}
      </div>
      <button class="text-xs opacity-60 hover:opacity-100 transition-opacity ml-2" onclick="this.parentElement.remove()">
        <i data-lucide="x" class="w-4 h-4"></i>
      </button>
    `;

    this.container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    // Trigger enter animation
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
    });

    // Auto dismiss
    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-x-4');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
}

// Global App Controller
class LearnSmartApp {
  constructor() {
    this.store = new LearnSmartStore();
    this.sound = new SoundFX();
    this.toast = new ToastManager();
    this.chart = null;
    this.activeDoubtFilter = 'all';
    this.activeLessonFilter = 'all';
    this.lessonSearchQuery = '';

    // Raft visual simulation state
    this.simRunning = false;
    this.simStep = 0;
    this.simTimer = null;
    this.simSpeed = 1;
    this.activeLesson = null;
    this.activeCcEnabled = true;

    this.init();
  }

  init() {
    this.bindEvents();
    this.render();
    this.store.subscribe((state) => {
      this.render();
    });

    // Handle initial Lucide icons
    if (window.lucide) window.lucide.createIcons();
  }

  bindEvents() {
    // Role switchers
    document.querySelectorAll('[data-action="switch-role"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const role = e.currentTarget.dataset.role;
        this.store.setRole(role);
        this.toast.show(
          role === 'teacher' ? '👨‍🏫 Teacher Dashboard' : '🎓 Student Active View',
          `Switched to ${role === 'teacher' ? 'Instructor Analytics & Moderation Mode' : 'Interactive Learning Workspace'}.`,
          'info'
        );
      });
    });

    // Offline mode toggle
    const offlineToggleBtn = document.getElementById('offline-toggle-btn');
    if (offlineToggleBtn) {
      offlineToggleBtn.addEventListener('click', () => {
        const isOffline = this.store.toggleOffline();
        this.sound.playNotification();
        if (isOffline) {
          this.toast.show(
            'Offline Mode Enabled',
            'All lecture notes, quiz modules, and summaries are cached and ready for disconnected study.',
            'offline'
          );
        } else {
          this.toast.show(
            'Live Sync Restored',
            'Connected to CS-204 classroom network. Live doubt broadcast & teacher telemetry active.',
            'success'
          );
        }
      });
    }

    // Doubt form submission
    const doubtForm = document.getElementById('doubt-submit-form');
    if (doubtForm) {
      doubtForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const topicSelect = document.getElementById('doubt-topic-select');
        const questionInput = document.getElementById('doubt-question-input');
        const question = questionInput.value.trim();
        if (!question) return;

        this.store.addDoubt(topicSelect.value, question);
        questionInput.value = '';
        this.sound.playSuccess();
        this.toast.show('Anonymous Doubt Submitted', 'Your question has been added anonymously to the live lecture queue.', 'success');
      });
    }

    // Doubt filter buttons
    document.querySelectorAll('[data-doubt-filter]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        this.activeDoubtFilter = e.currentTarget.dataset.doubtFilter;
        this.renderDoubts();
      });
    });

    // Teacher push live quiz
    const pushQuizBtn = document.getElementById('teacher-push-quiz-btn');
    if (pushQuizBtn) {
      pushQuizBtn.addEventListener('click', () => {
        this.store.pushLiveQuizAnnouncement(
          '⚡ Live Pop Quiz Alert from Prof. Thorne!',
          'Classroom Check: Please open your Live Short Quiz tab and complete the 3 questions on Raft consensus now.'
        );
        this.sound.playNotification();
        this.toast.show('Quiz Prompt Broadcasted', 'Instant alert sent to all 42 connected student devices.', 'alert');
      });
    }

    // Cohort simulator for demo
    const simulateCohortBtn = document.getElementById('simulate-cohort-btn');
    if (simulateCohortBtn) {
      simulateCohortBtn.addEventListener('click', () => {
        this.store.simulateCohortActivity();
        this.toast.show('Cohort Data Simulated', 'Generated new student submissions, questions, and telemetry!', 'info');
      });
    }

    // Reset demo button
    const resetDemoBtn = document.getElementById('reset-demo-btn');
    if (resetDemoBtn) {
      resetDemoBtn.addEventListener('click', () => {
        if (confirm('Reset classroom to fresh demonstration state?')) {
          this.store.resetDemoData();
          this.toast.show('Classroom Reset', 'Default state restored.', 'info');
        }
      });
    }

    // Lesson search and filter
    const lessonSearch = document.getElementById('lesson-search-input');
    if (lessonSearch) {
      lessonSearch.addEventListener('input', (e) => {
        this.lessonSearchQuery = e.target.value.toLowerCase();
        this.renderLessons();
      });
    }
  }

  // --- Rendering Pipeline ---

  render() {
    const state = this.store.state;

    // 1. Navbar badges & state
    this.renderNavbar(state);

    // 2. Role visibility (Student view vs Teacher view)
    const studentView = document.getElementById('student-view-container');
    const teacherView = document.getElementById('teacher-view-container');
    if (state.role === 'teacher') {
      if (studentView) studentView.classList.add('hidden');
      if (teacherView) teacherView.classList.remove('hidden');
      this.renderTeacherDashboard(state);
    } else {
      if (studentView) studentView.classList.remove('hidden');
      if (teacherView) teacherView.classList.add('hidden');
      this.renderStudentView(state);
    }

    // 3. Offline banner
    const offlineBanner = document.getElementById('offline-status-banner');
    if (offlineBanner) {
      if (state.isOffline) {
        offlineBanner.classList.remove('hidden');
      } else {
        offlineBanner.classList.add('hidden');
      }
    }

    // 4. Pop-up Broadcast banner for students
    const broadcastBanner = document.getElementById('broadcast-alert-banner');
    if (broadcastBanner) {
      if (state.activeBroadcast && state.role === 'student') {
        broadcastBanner.classList.remove('hidden');
        document.getElementById('broadcast-title').textContent = state.activeBroadcast.title;
        document.getElementById('broadcast-message').textContent = state.activeBroadcast.message;
        document.getElementById('broadcast-time').textContent = state.activeBroadcast.timestamp;
      } else {
        broadcastBanner.classList.add('hidden');
      }
    }

    if (window.lucide) window.lucide.createIcons();
  }

  renderNavbar(state) {
    // Mode toggle button visual state
    const offlineBtn = document.getElementById('offline-toggle-btn');
    const offlineDot = document.getElementById('offline-indicator-dot');
    const offlineText = document.getElementById('offline-indicator-text');

    if (offlineBtn && offlineDot && offlineText) {
      if (state.isOffline) {
        offlineDot.className = 'w-2.5 h-2.5 rounded-full bg-[#FF4266]';
        offlineText.textContent = 'Offline (Cached)';
        offlineBtn.className = 'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FFEBEF] text-[#D9264D] border border-[#FF4266]/30 hover:bg-[#FFE0E6] transition-colors';
      } else {
        offlineDot.className = 'w-2.5 h-2.5 rounded-full bg-[#3B735B] pulse-badge';
        offlineText.textContent = 'Online Sync';
        offlineBtn.className = 'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#E2ECE7] text-[#3B735B] border border-[#84AF9B]/40 hover:bg-[#D5E4DD] transition-colors';
      }
    }

    // Role switcher pills
    const studentRoleBtn = document.getElementById('role-pill-student');
    const teacherRoleBtn = document.getElementById('role-pill-teacher');

    if (studentRoleBtn && teacherRoleBtn) {
      if (state.role === 'student') {
        studentRoleBtn.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FAF8F4] text-[#1E2D28] shadow-sm';
        teacherRoleBtn.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#4A5B55] hover:text-[#1E2D28]';
      } else {
        studentRoleBtn.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#4A5B55] hover:text-[#1E2D28]';
        teacherRoleBtn.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FAF8F4] text-[#1E2D28] shadow-sm';
      }
    }
  }

  // --- Student View Pipeline ---

  renderStudentView(state) {
    this.renderChecklist(state);
    this.renderDoubts();
    this.renderQuiz(state);
    this.renderLessons();
  }

  renderChecklist(state) {
    const listContainer = document.getElementById('preclass-checklist-items');
    if (!listContainer) return;

    const checkedCount = state.checklist.filter((i) => i.checked).length;
    const totalCount = state.checklist.length;
    const percent = Math.round((checkedCount / totalCount) * 100);

    const percentBadge = document.getElementById('checklist-percent-badge');
    const progressBar = document.getElementById('checklist-progress-bar');
    if (percentBadge) percentBadge.textContent = `${percent}% Ready (${checkedCount}/${totalCount})`;
    if (progressBar) progressBar.style.width = `${percent}%`;

    listContainer.innerHTML = state.checklist
      .map(
        (item) => `
      <label class="flex items-start gap-3 p-2.5 rounded-xl transition-colors cursor-pointer hover:bg-[#FAF8F4]/80 group">
        <input type="checkbox" class="custom-checkbox mt-0.5" ${item.checked ? 'checked' : ''} onchange="app.handleChecklistToggle('${item.id}')">
        <span class="text-sm leading-snug ${item.checked ? 'line-through text-[#6E7F79]' : 'text-[#1E2D28] font-medium'} group-hover:text-[#1E2D28]">
          ${item.text}
        </span>
      </label>
    `
      )
      .join('');
  }

  handleChecklistToggle(id) {
    this.store.toggleChecklist(id);
    this.sound.playSuccess();
  }

  renderDoubts() {
    const state = this.store.state;
    const container = document.getElementById('doubts-stream-container');
    const countBadge = document.getElementById('doubts-count-badge');
    if (!container) return;

    let filtered = state.doubts;
    if (this.activeDoubtFilter === 'pending') {
      filtered = state.doubts.filter((d) => d.status === 'pending');
    } else if (this.activeDoubtFilter === 'answered') {
      filtered = state.doubts.filter((d) => d.status === 'answered');
    }

    if (countBadge) countBadge.textContent = `${filtered.length} Doubts`;

    // Update filter tabs UI
    document.querySelectorAll('[data-doubt-filter]').forEach((btn) => {
      if (btn.dataset.doubtFilter === this.activeDoubtFilter) {
        btn.className = 'px-3 py-1 rounded-lg text-xs font-semibold bg-[#3B735B] text-white shadow-sm';
      } else {
        btn.className = 'px-3 py-1 rounded-lg text-xs font-medium text-[#4A5B55] hover:bg-[#FAF8F4]';
      }
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 px-4 rounded-xl border border-dashed border-[#DDD8CB] bg-[#FAF8F4]">
          <i data-lucide="message-square-dashed" class="w-10 h-10 mx-auto text-[#84AF9B] mb-2 opacity-60"></i>
          <p class="text-sm font-semibold text-[#1E2D28]">No doubts found in this tab</p>
          <p class="text-xs text-[#6E7F79] mt-1">Ask an anonymous question above to spark class discussion!</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = filtered
      .map((d) => {
        const isAnswered = d.status === 'answered';
        return `
        <div class="p-4 rounded-xl border ${d.pinned ? 'border-[#3B735B]/40 bg-[#E2ECE7]/30' : 'border-[#DDD8CB] bg-[#FAF8F4]'} shadow-sm card-hover relative">
          ${d.pinned ? `
            <div class="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-[#3B735B] text-white flex items-center gap-1 shadow-sm">
              <i data-lucide="pin" class="w-3 h-3"></i> Pinned by Instructor
            </div>
          ` : ''}

          <div class="flex items-center justify-between gap-2 mb-2">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#EFECE4] text-[#1E2D28] border border-[#DDD8CB]">
                ${d.topic}
              </span>
              <span class="text-[11px] text-[#6E7F79] flex items-center gap-1">
                <i data-lucide="clock" class="w-3 h-3"></i> ${d.createdAt}
              </span>
            </div>
            <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
              isAnswered ? 'bg-[#E2ECE7] text-[#3B735B]' : 'bg-[#FFF5EE] text-[#D9264D]'
            }">
              <i data-lucide="${isAnswered ? 'check-circle-2' : 'help-circle'}" class="w-3 h-3"></i>
              ${isAnswered ? 'Answered' : 'Pending'}
            </span>
          </div>

          <p class="text-sm font-medium text-[#1E2D28] leading-relaxed mb-3">
            ${d.question}
          </p>

          ${
            isAnswered && d.answerText
              ? `
            <div class="mb-3 p-3 rounded-lg bg-[#E2ECE7]/50 border-l-4 border-[#3B735B] text-xs text-[#1E2D28]">
              <div class="flex items-center gap-1 font-semibold text-[#3B735B] mb-1">
                <i data-lucide="check" class="w-3.5 h-3.5"></i> Instructor Resolution:
              </div>
              <p class="leading-normal">${d.answerText}</p>
            </div>
          `
              : ''
          }

          <div class="flex items-center justify-between pt-2 border-t border-[#DDD8CB]/60">
            <button onclick="app.handleUpvote('${d.id}')" class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
          d.userUpvoted
            ? 'bg-[#FF4266] text-white shadow-sm scale-105'
            : 'bg-[#EFECE4] text-[#1E2D28] hover:bg-[#DDD8CB]'
        }">
              <i data-lucide="thumbs-up" class="w-3.5 h-3.5 ${d.userUpvoted ? 'fill-current' : ''}"></i>
              <span>${d.upvotes} Upvotes</span>
            </button>

            <span class="text-[11px] text-[#6E7F79] italic flex items-center gap-1">
              <i data-lucide="shield-check" class="w-3 h-3 text-[#84AF9B]"></i> Anonymous Peer
            </span>
          </div>
        </div>
      `;
      })
      .join('');

    if (window.lucide) window.lucide.createIcons();
  }

  handleUpvote(id) {
    this.store.toggleUpvote(id);
    this.sound.playSuccess();
  }

  // --- Quiz Pipeline ---

  renderQuiz(state) {
    const quizContainer = document.getElementById('live-quiz-container');
    if (!quizContainer) return;

    const quiz = state.quiz;
    const progress = quiz.userProgress;
    const questions = quiz.questions;
    const currentQ = questions[progress.currentIndex];

    // Check if submitted
    if (progress.isSubmitted) {
      const totalQ = questions.length;
      const score = progress.score;
      const percent = Math.round((score / totalQ) * 100);

      quizContainer.innerHTML = `
        <div class="text-center py-8 px-4">
          <div class="w-16 h-16 mx-auto rounded-full ${score === 3 ? 'bg-[#E2ECE7] text-[#3B735B]' : 'bg-[#FFF5EE] text-[#FF4266]'} flex items-center justify-center mb-4 shadow-sm animate-bounce">
            <i data-lucide="${score >= 2 ? 'award' : 'refresh-cw'}" class="w-8 h-8"></i>
          </div>
          <h4 class="text-xl font-bold text-[#1E2D28] mb-1">
            ${score === 3 ? 'Outstanding! Perfect Score 🎉' : score === 2 ? 'Solid Comprehension! 👏' : 'Keep Reviewing! 📚'}
          </h4>
          <p class="text-xs text-[#6E7F79] mb-4">Completed at ${progress.completedAt || 'Today'} • Sync to Teacher Dashboard Active</p>
          
          <div class="inline-flex items-center gap-4 p-4 rounded-2xl bg-[#FAF8F4] border border-[#DDD8CB] mb-6">
            <div class="text-center">
              <span class="block text-2xl font-black text-[#1E2D28]">${score}/${totalQ}</span>
              <span class="text-[11px] uppercase tracking-wider text-[#6E7F79] font-medium">Questions Correct</span>
            </div>
            <div class="w-px h-8 bg-[#DDD8CB]"></div>
            <div class="text-center">
              <span class="block text-2xl font-black ${score >= 2 ? 'text-[#3B735B]' : 'text-[#D9264D]'}">${percent}%</span>
              <span class="text-[11px] uppercase tracking-wider text-[#6E7F79] font-medium">Accuracy</span>
            </div>
          </div>

          <!-- Review Question Explanations -->
          <div class="space-y-3 text-left mb-6">
            ${questions
              .map((q, idx) => {
                const userAns = progress.selectedAnswers[q.id];
                const isCorrect = userAns === q.correctIndex;
                return `
                <div class="p-3.5 rounded-xl border ${isCorrect ? 'border-[#3B735B]/30 bg-[#E2ECE7]/30' : 'border-[#FF4266]/30 bg-[#FFEBEF]/40'} text-xs">
                  <div class="flex items-center justify-between font-semibold mb-1">
                    <span class="text-[#1E2D28]">Q${idx + 1}: ${q.prompt}</span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold ${isCorrect ? 'bg-[#3B735B] text-white' : 'bg-[#FF4266] text-white'}">
                      ${isCorrect ? 'Correct' : 'Missed'}
                    </span>
                  </div>
                  <p class="text-[#6E7F79] mt-1"><strong class="text-[#1E2D28]">Answer:</strong> ${q.options[q.correctIndex]}</p>
                  <p class="text-[#4A5B55] mt-1 bg-white/70 p-2 rounded-lg border border-[#DDD8CB]/50">
                    <strong class="text-[#3B735B]">Insight:</strong> ${q.explanation}
                  </p>
                </div>
              `;
              })
              .join('')}
          </div>

          <div class="flex items-center justify-center gap-3">
            <button onclick="app.handleQuizRetake()" class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#1E2D28] text-white hover:bg-[#3B735B] transition-colors shadow-sm">
              <i data-lucide="rotate-ccw" class="w-4 h-4"></i> Retake Practice Quiz
            </button>
            <button onclick="app.scrollToLessons()" class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#EFECE4] text-[#1E2D28] hover:bg-[#DDD8CB] transition-colors">
              <i data-lucide="video" class="w-4 h-4"></i> Study Concept Clips
            </button>
          </div>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    // Active Quiz Question View
    const totalQ = questions.length;
    const progressPercent = Math.round(((progress.currentIndex + 1) / totalQ) * 100);
    const selectedOption = progress.selectedAnswers[currentQ.id];
    const isAnswered = selectedOption !== undefined;

    quizContainer.innerHTML = `
      <div>
        <!-- Quiz Header & Step Indicators -->
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold uppercase tracking-wider text-[#3B735B] flex items-center gap-1.5">
            <i data-lucide="sparkles" class="w-3.5 h-3.5"></i> Question ${progress.currentIndex + 1} of ${totalQ}
          </span>
          <span class="text-xs font-semibold text-[#6E7F79]">${currentQ.topic}</span>
        </div>

        <!-- Progress Bar -->
        <div class="w-full h-1.5 bg-[#DDD8CB] rounded-full overflow-hidden mb-5">
          <div class="h-full bg-[#3B735B] transition-all duration-300" style="width: ${progressPercent}%"></div>
        </div>

        <!-- Question Prompt -->
        <h4 class="text-base font-semibold text-[#1E2D28] mb-4 leading-snug">
          ${currentQ.prompt}
        </h4>

        <!-- Options List -->
        <div class="space-y-2.5 mb-5">
          ${currentQ.options
            .map((opt, optIdx) => {
              const isSelected = selectedOption === optIdx;
              const isCorrect = optIdx === currentQ.correctIndex;

              let btnClass = 'border-[#DDD8CB] bg-[#FAF8F4] text-[#1E2D28] hover:bg-[#FAF8F4]/90 hover:border-[#84AF9B]';

              if (isAnswered) {
                if (isSelected && isCorrect) {
                  btnClass = 'border-[#3B735B] bg-[#E2ECE7] text-[#1E2D28] font-semibold ring-2 ring-[#3B735B]/30';
                } else if (isSelected && !isCorrect) {
                  btnClass = 'border-[#FF4266] bg-[#FFEBEF] text-[#1E2D28] font-semibold ring-2 ring-[#FF4266]/30';
                } else if (isCorrect) {
                  btnClass = 'border-[#3B735B] bg-[#E2ECE7]/60 text-[#1E2D28]';
                } else {
                  btnClass = 'border-[#DDD8CB]/50 opacity-50 bg-[#FAF8F4]';
                }
              }

              return `
              <button onclick="app.handleSelectQuizAnswer(${currentQ.id}, ${optIdx})" class="w-full text-left p-3.5 rounded-xl border transition-all text-xs flex items-start gap-3 ${btnClass}">
                <span class="w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center font-bold text-[11px] ${
                  isSelected ? 'bg-[#1E2D28] text-white' : 'bg-[#EFECE4] text-[#4A5B55]'
                }">
                  ${String.fromCharCode(65 + optIdx)}
                </span>
                <span class="flex-1 leading-relaxed">${opt}</span>
                ${
                  isAnswered && isSelected && isCorrect
                    ? '<i data-lucide="check" class="w-4 h-4 text-[#3B735B] flex-shrink-0"></i>'
                    : isAnswered && isSelected && !isCorrect
                    ? '<i data-lucide="x" class="w-4 h-4 text-[#FF4266] flex-shrink-0"></i>'
                    : ''
                }
              </button>
            `;
            })
            .join('')}
        </div>

        <!-- Instant Explanation Feedback when an option is selected -->
        ${
          isAnswered
            ? `
          <div class="mb-5 p-3.5 rounded-xl ${
            selectedOption === currentQ.correctIndex
              ? 'bg-[#E2ECE7] border-l-4 border-[#3B735B]'
              : 'bg-[#FFEBEF] border-l-4 border-[#FF4266]'
          } text-xs transition-all animate-fadeIn">
            <p class="font-bold ${selectedOption === currentQ.correctIndex ? 'text-[#3B735B]' : 'text-[#D9264D]'} mb-1 flex items-center gap-1.5">
              <i data-lucide="${selectedOption === currentQ.correctIndex ? 'check-circle' : 'alert-circle'}" class="w-4 h-4"></i>
              ${selectedOption === currentQ.correctIndex ? 'Correct! High-Yield Insight:' : 'Incorrect. Key Revision Point:'}
            </p>
            <p class="text-[#1E2D28] leading-relaxed">${currentQ.explanation}</p>
          </div>
        `
            : ''
        }

        <!-- Quiz Navigation Controls -->
        <div class="flex items-center justify-between pt-3 border-t border-[#DDD8CB]">
          <button 
            onclick="app.handlePrevQuizQuestion()" 
            class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-[#4A5B55] hover:text-[#1E2D28] disabled:opacity-30 disabled:pointer-events-none"
            ${progress.currentIndex === 0 ? 'disabled' : ''}
          >
            <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i> Previous
          </button>

          <div class="flex items-center gap-2">
            ${
              progress.currentIndex < totalQ - 1
                ? `
              <button 
                onclick="app.handleNextQuizQuestion()" 
                class="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold bg-[#1E2D28] text-white hover:bg-[#3B735B] transition-colors shadow-sm disabled:opacity-40 disabled:pointer-events-none"
                ${!isAnswered ? 'disabled' : ''}
              >
                Next Question <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
              </button>
            `
                : `
              <button 
                onclick="app.handleSubmitQuiz()" 
                class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#FF4266] text-white hover:bg-[#D9264D] transition-colors shadow-sm disabled:opacity-40 disabled:pointer-events-none"
                ${!isAnswered ? 'disabled' : ''}
              >
                <i data-lucide="send" class="w-3.5 h-3.5"></i> Finish & Submit Score
              </button>
            `
            }
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }

  handleSelectQuizAnswer(qId, optIdx) {
    this.store.selectQuizAnswer(qId, optIdx);
    const q = this.store.state.quiz.questions.find((x) => x.id === qId);
    if (q && optIdx === q.correctIndex) {
      this.sound.playSuccess();
    }
  }

  handlePrevQuizQuestion() {
    const cur = this.store.state.quiz.userProgress.currentIndex;
    if (cur > 0) {
      this.store.setQuizCurrentIndex(cur - 1);
    }
  }

  handleNextQuizQuestion() {
    const cur = this.store.state.quiz.userProgress.currentIndex;
    const total = this.store.state.quiz.questions.length;
    if (cur < total - 1) {
      this.store.setQuizCurrentIndex(cur + 1);
    }
  }

  handleSubmitQuiz() {
    const score = this.store.submitQuiz();
    this.sound.playSuccess();
    if (window.confetti) {
      window.confetti({
        particleCount: score === 3 ? 100 : 50,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
    this.toast.show(
      'Quiz Completed!',
      `You scored ${score}/3. Your comprehension telemetry has been synced to the Teacher Dashboard.`,
      'success'
    );
  }

  handleQuizRetake() {
    this.store.resetQuiz();
  }

  scrollToLessons() {
    const el = document.getElementById('visual-explainers-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  // --- Visual Explainers & Offline Notes Pipeline ---

  renderLessons() {
    const container = document.getElementById('lesson-cards-container');
    if (!container) return;

    const lessons = this.store.state.lessons;
    let filtered = lessons;

    if (this.lessonSearchQuery) {
      filtered = filtered.filter(
        (l) =>
          l.title.toLowerCase().includes(this.lessonSearchQuery) ||
          l.summary.toLowerCase().includes(this.lessonSearchQuery) ||
          l.topic.toLowerCase().includes(this.lessonSearchQuery)
      );
    }

    if (this.activeLessonFilter !== 'all') {
      filtered = filtered.filter((l) => l.topic.toLowerCase() === this.activeLessonFilter.toLowerCase());
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12 px-4 rounded-xl border border-dashed border-[#DDD8CB] bg-[#FAF8F4]">
          <i data-lucide="search-x" class="w-8 h-8 mx-auto text-[#84AF9B] mb-2 opacity-60"></i>
          <p class="text-sm font-semibold text-[#1E2D28]">No lesson clips match your query</p>
          <p class="text-xs text-[#6E7F79] mt-1">Try clearing filters or search terms.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = filtered
      .map(
        (l) => `
      <div class="p-5 rounded-2xl bg-[#EFECE4] border border-[#DDD8CB] flex flex-col justify-between card-hover shadow-sm group">
        <div>
          <!-- Thumbnail Simulation Banner -->
          <div class="relative w-full h-32 rounded-xl bg-[#FAF8F4] border border-[#DDD8CB] mb-4 overflow-hidden flex items-center justify-center cursor-pointer group/thumb" onclick="app.openLessonModal('${l.id}')">
            <!-- Simulated Cluster Nodes Canvas Background -->
            <svg class="absolute inset-0 w-full h-full opacity-60 pointer-events-none" viewBox="0 0 300 120">
              <line x1="60" y1="60" x2="150" y2="40" stroke="#84AF9B" stroke-width="2" stroke-dasharray="4" />
              <line x1="240" y1="60" x2="150" y2="40" stroke="#84AF9B" stroke-width="2" stroke-dasharray="4" />
              <circle cx="150" cy="40" r="18" fill="#3B735B" />
              <circle cx="60" cy="60" r="14" fill="#84AF9B" />
              <circle cx="240" cy="60" r="14" fill="#84AF9B" />
              <text x="150" y="44" fill="#FFF" font-size="9" text-anchor="middle" font-weight="bold">Leader</text>
              <text x="60" y="64" fill="#FFF" font-size="8" text-anchor="middle">Node 2</text>
              <text x="240" y="64" fill="#FFF" font-size="8" text-anchor="middle">Node 3</text>
            </svg>
            
            <div class="z-10 w-11 h-11 rounded-full bg-[#1E2D28] text-white flex items-center justify-center group-hover/thumb:scale-110 transition-transform shadow-md">
              <i data-lucide="play" class="w-5 h-5 ml-0.5 fill-current"></i>
            </div>
            
            <span class="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold bg-[#1E2D28]/80 text-white">
              ${l.duration}
            </span>
            <span class="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FAF8F4] text-[#3B735B] border border-[#84AF9B]/30">
              ${l.badge}
            </span>
          </div>

          <div class="flex items-center gap-2 mb-2">
            <span class="text-xs font-semibold px-2 py-0.5 rounded bg-[#FAF8F4] text-[#1E2D28] border border-[#DDD8CB]">
              ${l.topic}
            </span>
            <span class="text-xs text-[#6E7F79]">• ${l.difficulty}</span>
          </div>

          <h4 class="text-sm font-bold text-[#1E2D28] mb-1.5 leading-snug group-hover:text-[#3B735B] transition-colors">
            ${l.title}
          </h4>
          <p class="text-xs text-[#4A5B55] leading-relaxed mb-4">
            ${l.summary}
          </p>
        </div>

        <div class="flex items-center gap-2 pt-3 border-t border-[#DDD8CB]">
          <button onclick="app.openLessonModal('${l.id}')" class="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-[#1E2D28] text-white hover:bg-[#3B735B] transition-colors shadow-sm">
            <i data-lucide="play-circle" class="w-4 h-4"></i> Watch & Read
          </button>
          
          <button onclick="app.handleDownloadOfflineNote('${l.id}')" title="Export as Offline Study Note (.txt)" class="flex items-center justify-center gap-1 py-2 px-3 rounded-xl text-xs font-semibold bg-[#FAF8F4] text-[#1E2D28] border border-[#DDD8CB] hover:bg-[#DDD8CB] transition-colors">
            <i data-lucide="download" class="w-4 h-4 text-[#3B735B]"></i>
            <span class="hidden sm:inline">Offline</span>
          </button>
        </div>
      </div>
    `
      )
      .join('');

    if (window.lucide) window.lucide.createIcons();
  }

  openLessonModal(lessonId) {
    const lesson = this.store.state.lessons.find((l) => l.id === lessonId);
    if (!lesson) return;

    this.activeLesson = lesson;
    const modal = document.getElementById('lesson-watch-modal');
    if (!modal) return;

    document.getElementById('modal-lesson-title').textContent = lesson.title;
    document.getElementById('modal-lesson-topic').textContent = lesson.topic;
    document.getElementById('modal-lesson-duration').textContent = lesson.duration;

    const pointsList = document.getElementById('modal-lesson-key-points');
    if (pointsList) {
      pointsList.innerHTML = lesson.keyPoints
        .map(
          (pt, idx) => `
        <li class="flex items-start gap-2.5 p-2 rounded-lg bg-[#FAF8F4] border border-[#DDD8CB]/70 text-xs">
          <span class="w-5 h-5 rounded-full bg-[#E2ECE7] text-[#3B735B] font-bold flex-shrink-0 flex items-center justify-center text-[10px]">
            ${idx + 1}
          </span>
          <span class="text-[#1E2D28] leading-relaxed">${pt}</span>
        </li>
      `
        )
        .join('');
    }

    modal.classList.remove('hidden');
    this.startRaftSimulation();
    if (window.lucide) window.lucide.createIcons();
  }

  closeLessonModal() {
    const modal = document.getElementById('lesson-watch-modal');
    if (modal) modal.classList.add('hidden');
    this.stopRaftSimulation();
  }

  startRaftSimulation() {
    this.simRunning = true;
    this.simStep = 0;
    this.renderSimFrame();
    if (this.simTimer) clearInterval(this.simTimer);
    this.simTimer = setInterval(() => {
      if (this.simRunning) {
        this.simStep = (this.simStep + 1) % 60;
        this.renderSimFrame();
      }
    }, 1000 / (2 * this.simSpeed));
  }

  stopRaftSimulation() {
    this.simRunning = false;
    if (this.simTimer) {
      clearInterval(this.simTimer);
      this.simTimer = null;
    }
  }

  toggleSimPlay() {
    this.simRunning = !this.simRunning;
    const playBtnIcon = document.getElementById('sim-play-btn-icon');
    if (playBtnIcon) {
      playBtnIcon.setAttribute('data-lucide', this.simRunning ? 'pause' : 'play');
      if (window.lucide) window.lucide.createIcons();
    }
  }

  toggleSimCC() {
    this.activeCcEnabled = !this.activeCcEnabled;
    const ccOverlay = document.getElementById('sim-cc-overlay');
    const ccBtn = document.getElementById('sim-cc-toggle-btn');
    if (ccOverlay) {
      if (this.activeCcEnabled) {
        ccOverlay.classList.remove('hidden');
      } else {
        ccOverlay.classList.add('hidden');
      }
    }
    if (ccBtn) {
      ccBtn.className = this.activeCcEnabled
        ? 'px-2 py-1 rounded text-xs font-bold bg-[#3B735B] text-white'
        : 'px-2 py-1 rounded text-xs font-medium text-[#6E7F79] hover:bg-[#FAF8F4]';
    }
  }

  renderSimFrame() {
    const canvas = document.getElementById('raft-sim-svg');
    const ccText = document.getElementById('sim-cc-text');
    const simTimeLabel = document.getElementById('sim-current-time');
    const simProgressBar = document.getElementById('sim-progress-bar');
    if (!canvas) return;

    const seconds = Math.floor(this.simStep * 3);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (simTimeLabel) simTimeLabel.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs} / 3:15`;
    if (simProgressBar) simProgressBar.style.width = `${(this.simStep / 60) * 100}%`;

    // Dynamic Closed-Caption Subtitle script based on timeline
    if (ccText) {
      if (this.simStep < 15) {
        ccText.textContent = 'Follower timers ticking down... Randomized timeouts prevent split vote deadlocks.';
      } else if (this.simStep < 30) {
        ccText.textContent = 'Node A timer expires! Transitions to Candidate, increments term to 4, votes for self.';
      } else if (this.simStep < 45) {
        ccText.textContent = 'Node A receives majority quorum ACKs (2/3 nodes). Elevated to Cluster Leader!';
      } else {
        ccText.textContent = 'Leader emits steady heartbeat AppendEntries RPCs at 50ms intervals to sustain authority.';
      }
    }

    // High quality animated SVG Nodes
    const phase = this.simStep % 4;
    const isLeaderElected = this.simStep >= 30;

    canvas.innerHTML = `
      <defs>
        <radialGradient id="leaderGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#3B735B" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#3B735B" stop-opacity="0"/>
        </radialGradient>
      </defs>

      <!-- Network Connections with Animated Heartbeat Packets -->
      <line x1="160" y1="120" x2="300" y2="240" stroke="#84AF9B" stroke-width="2" stroke-dasharray="6 4" class="packet-stream"/>
      <line x1="440" y1="120" x2="300" y2="240" stroke="#84AF9B" stroke-width="2" stroke-dasharray="6 4" class="packet-stream"/>
      <line x1="160" y1="120" x2="440" y2="120" stroke="#DDD8CB" stroke-width="2" />

      <!-- Center Node A (Candidate / Leader) -->
      <g transform="translate(300, 240)">
        <circle cx="0" cy="0" r="48" fill="url(#leaderGlow)" />
        <circle cx="0" cy="0" r="38" fill="${isLeaderElected ? '#3B735B' : '#FF4266'}" stroke="#FAF8F4" stroke-width="4" class="shadow"/>
        <text x="0" y="-8" fill="#FFF" font-size="12" font-weight="bold" text-anchor="middle">NODE A</text>
        <text x="0" y="10" fill="#FAF8F4" font-size="10" text-anchor="middle" font-weight="600">${isLeaderElected ? 'LEADER (Term 4)' : 'CANDIDATE'}</text>
        <text x="0" y="24" fill="#FACDB0" font-size="9" text-anchor="middle">${isLeaderElected ? 'Sending Heartbeats' : 'Requesting Votes'}</text>
      </g>

      <!-- Follower Node B -->
      <g transform="translate(160, 120)">
        <circle cx="0" cy="0" r="32" fill="#84AF9B" stroke="#FAF8F4" stroke-width="3" />
        <text x="0" y="-5" fill="#FFF" font-size="11" font-weight="bold" text-anchor="middle">NODE B</text>
        <text x="0" y="11" fill="#FAF8F4" font-size="9" text-anchor="middle">Follower</text>
      </g>

      <!-- Follower Node C -->
      <g transform="translate(440, 120)">
        <circle cx="0" cy="0" r="32" fill="#84AF9B" stroke="#FAF8F4" stroke-width="3" />
        <text x="0" y="-5" fill="#FFF" font-size="11" font-weight="bold" text-anchor="middle">NODE C</text>
        <text x="0" y="11" fill="#FAF8F4" font-size="9" text-anchor="middle">Follower</text>
      </g>

      <!-- Floating State Badge -->
      <g transform="translate(300, 45)">
        <rect x="-110" y="-14" width="220" height="28" rx="14" fill="#1E2D28" opacity="0.85" />
        <text x="0" y="4" fill="#FAF8F4" font-size="10" text-anchor="middle" font-weight="600">
          Cluster Status: ${isLeaderElected ? 'Quorum Maintained (2/3 Nodes ACK)' : 'Election Timeout in Progress'}
        </text>
      </g>
    `;
  }

  handleDownloadOfflineNote(lessonId) {
    const lesson = this.store.state.lessons.find((l) => l.id === lessonId);
    if (!lesson) return;

    this.store.recordDownload(lessonId);

    // Generate formatted .txt study note content
    const content = `
================================================================================
LEARNSMART CLASSROOM STUDY NOTES (OFFLINE CACHED EXPORT)
Course: ${this.store.state.room.title} (${this.store.state.room.code})
Topic: ${lesson.title}
Instructor: ${this.store.state.room.instructor}
Export Timestamp: ${new Date().toLocaleString()}
================================================================================

1. EXECUTIVE SUMMARY:
--------------------------------------------------------------------------------
${lesson.summary}

2. CORE HIGH-YIELD REVISION POINTS:
--------------------------------------------------------------------------------
${lesson.keyPoints.map((pt, i) => `[${i + 1}] ${pt}`).join('\n')}

3. MATHEMATICAL THEOREMS & QUORUM BOUNDS:
--------------------------------------------------------------------------------
* Minimum Quorum Rule: Q = floor(N / 2) + 1
* Crash Fault Tolerance: F = floor((N - 1) / 2)
* Log Matching Safety Invariant:
  If two entries in different logs have the same index and term, then:
  (a) they store the exact same command, and
  (b) their logs are completely identical up to that index.

4. COMMON COLLEGE EXAM TRAPS:
--------------------------------------------------------------------------------
- TRAP 1: Assuming even server clusters increase resilience.
  -> False: 6 nodes tolerate the same 2 failures as 5 nodes, but require 4 ACKs.
- TRAP 2: Believing uncommitted entries from past terms can be committed directly.
  -> False: Raft leaders only commit entries from their own term by counting replicas.

5. VERIFICATION HASH:
--------------------------------------------------------------------------------
Integrity Checksum: sha256-${Math.random().toString(36).substring(2, 12)}
Generated by LearnSmart Web App for disconnected exam prep.
================================================================================
`.trim();

    // Trigger file download in browser
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = lesson.offlineFile || `${lesson.id}_notes.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.sound.playSuccess();
    this.toast.show(
      'Offline Note Exported',
      `Saved ${link.download}. Teacher Offline Downloads KPI incremented!`,
      'success'
    );
  }

  // --- Teacher Dashboard Pipeline ---

  renderTeacherDashboard(state) {
    const stats = state.stats;
    const enrolled = state.room.enrolledCount;
    const active = state.room.activeCount;

    // 1. KPI Cards
    const avgScore = stats.quizSubmissions > 0 ? Math.round((stats.totalQuizScoreSum / (stats.quizSubmissions * 3)) * 100) : 84;
    const participationRate = Math.round((active / enrolled) * 100);
    const pendingDoubts = state.doubts.filter((d) => d.status === 'pending').length;

    const kpiComprehension = document.getElementById('kpi-comprehension-val');
    const kpiParticipation = document.getElementById('kpi-participation-val');
    const kpiPendingDoubts = document.getElementById('kpi-doubts-val');
    const kpiDownloads = document.getElementById('kpi-downloads-val');

    if (kpiComprehension) kpiComprehension.textContent = `${avgScore}%`;
    if (kpiParticipation) kpiParticipation.textContent = `${participationRate}%`;
    if (kpiPendingDoubts) kpiPendingDoubts.textContent = pendingDoubts;
    if (kpiDownloads) kpiDownloads.textContent = stats.downloadsCount;

    // 2. Chart.js Topic Comprehension Bar Chart
    this.renderComprehensionChart(state);

    // 3. Doubt Moderation List
    this.renderTeacherModerationList(state);
  }

  renderComprehensionChart(state) {
    const ctx = document.getElementById('topicComprehensionChart');
    if (!ctx) return;

    const topics = Object.keys(state.stats.topicComprehension);
    const values = Object.values(state.stats.topicComprehension);

    if (this.chart) {
      this.chart.data.labels = topics;
      this.chart.data.datasets[0].data = values;
      this.chart.update('none'); // smooth update without jarring reload
      return;
    }

    if (typeof Chart === 'undefined') return;

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: topics,
        datasets: [
          {
            label: 'Comprehension %',
            data: values,
            backgroundColor: values.map((v) => (v >= 80 ? '#3B735B' : v >= 75 ? '#84AF9B' : '#FF4266')),
            borderRadius: 8,
            borderSkipped: false,
            barThickness: 28
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1E2D28',
            titleColor: '#FAF8F4',
            bodyColor: '#E2ECE7',
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (item) => ` Class Mastery: ${item.raw}%`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              color: '#6E7F79',
              font: { family: 'Inter', size: 11 },
              callback: (v) => v + '%'
            },
            grid: {
              color: '#EFECE4'
            }
          },
          x: {
            ticks: {
              color: '#1E2D28',
              font: { family: 'Inter', size: 11, weight: '500' }
            },
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  renderTeacherModerationList(state) {
    const container = document.getElementById('teacher-doubt-moderation-list');
    if (!container) return;

    const doubts = state.doubts;

    if (doubts.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 text-[#6E7F79] text-xs">
          No classroom questions submitted yet.
        </div>
      `;
      return;
    }

    container.innerHTML = doubts
      .map((d) => {
        const isAnswered = d.status === 'answered';
        return `
        <div class="p-3.5 rounded-xl border ${
          isAnswered ? 'border-[#DDD8CB] bg-[#FAF8F4]' : 'border-[#FF4266]/30 bg-[#FFF5EE]'
        } flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
                isAnswered ? 'bg-[#E2ECE7] text-[#3B735B]' : 'bg-[#FF4266] text-white'
              }">
                ${isAnswered ? 'RESOLVED' : 'ACTION REQUIRED'}
              </span>
              <span class="font-semibold text-[#1E2D28]">${d.topic}</span>
              <span class="text-[#6E7F79]">• ${d.createdAt}</span>
              <span class="text-[#D9264D] font-bold">♥ ${d.upvotes} upvotes</span>
            </div>
            <p class="text-[#1E2D28] font-medium leading-relaxed">${d.question}</p>
            ${
              d.answerText
                ? `<p class="mt-1.5 text-[#3B735B] bg-[#E2ECE7]/50 p-2 rounded-lg"><strong class="font-semibold">Instructor Note:</strong> ${d.answerText}</p>`
                : ''
            }
          </div>

          <div class="flex items-center gap-2 flex-shrink-0">
            ${
              !isAnswered
                ? `
              <button onclick="app.promptTeacherAnswer('${d.id}')" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#3B735B] text-white hover:bg-[#295442] transition-colors flex items-center gap-1 shadow-sm">
                <i data-lucide="check" class="w-3.5 h-3.5"></i> Mark Answered
              </button>
            `
                : `
              <span class="px-3 py-1.5 rounded-lg text-xs font-medium text-[#3B735B] bg-[#E2ECE7] flex items-center gap-1">
                <i data-lucide="check-check" class="w-3.5 h-3.5"></i> Resolved in Class
              </span>
            `
            }

            <button onclick="app.store.togglePinDoubt('${d.id}')" title="Pin / Unpin to Blackboard" class="p-1.5 rounded-lg border border-[#DDD8CB] text-[#1E2D28] hover:bg-[#EFECE4] transition-colors">
              <i data-lucide="pin" class="w-3.5 h-3.5 ${d.pinned ? 'fill-[#3B735B] text-[#3B735B]' : ''}"></i>
            </button>
          </div>
        </div>
      `;
      })
      .join('');

    if (window.lucide) window.lucide.createIcons();
  }

  promptTeacherAnswer(id) {
    const answer = prompt(
      'Enter resolution / verbal clarification summary for this question (or leave blank to mark answered verbally):'
    );
    if (answer !== null) {
      this.store.resolveDoubt(id, answer);
      this.sound.playSuccess();
      this.toast.show('Doubt Resolved', 'Marked as answered and synced to all student displays.', 'success');
    }
  }
}

// Global bootstrap
let app;
window.addEventListener('DOMContentLoaded', () => {
  app = new LearnSmartApp();
  window.app = app; // Expose for inline event handlers
});
