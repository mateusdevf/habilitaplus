const App = {
      state: {
        view: 'dashboard',
        simRunning: false,
        simTimer: null,
        simTimeLeft: 0,
        currentSim: null,
        history: JSON.parse(localStorage.getItem('auto_history') || '[]'),
        theme: localStorage.getItem('auto_theme') || 'dark',
      },

      // Dados de Exemplo
      data: {
        courses: [
          {id:1,title:'Teoria - Regras de Trânsito',cat:'teoria',progress:72,desc:'Placas, fluxos e penalidades'},
          {id:2,title:'Direção Básica',cat:'pratica',progress:34,desc:'Controles do veículo e manobras'},
          {id:3,title:'Noções de Mecânica',cat:'tecnica',progress:12,desc:'Itens de segurança e manutenção'},
          {id:4,title:'Simulado: Prova teórica',cat:'teoria',progress:0,desc:'Provas cronometradas'}
        ],
        questions: [
          {id:101,cat:'teoria',q:'O que significa uma placa de pare?',options:['Diminua a velocidade','Prossiga com cuidado','Pare completamente','Apenas atenção'],answer:2},
          {id:102,cat:'teoria',q:'Qual limite em área urbana quando não sinalizado?',options:['30 km/h','50 km/h','60 km/h','80 km/h'],answer:1},
          {id:103,cat:'pratica',q:'Ao estacionar em rampa, você deve?',options:['Deixar o freio de mão e roda livre','Virar as rodas ao acostamento e usar freio de mão','Desligar o veículo','Estacionar paralelo a via'],answer:1},
          {id:104,cat:'tecnica',q:'Como checar nível do óleo?',options:['Com o motor frio e vareta','Com o motor ligado e em marcha lenta','Nunca checar','Apenas no posto de gasolina'],answer:0}
        ],
        guides: [
          {id:'g1',title:'Checklist antes de ligar o carro',steps:['Ajuste do banco e espelhos','Cinto de segurança','Freios e luzes','Mude para ponto morto']},
          {id:'g2',title:'Manobras: Estacionamento paralelo',steps:['Sinalize','Aproxime do veículo da frente','Faça marcha à ré com pequenos ajustes','Ajuste a posição final']}
        ]
      },
      
      // Funções Utilitárias
      $: (sel, root = document) => root.querySelector(sel),
      $$: (sel, root = document) => Array.from(root.querySelectorAll(sel)),
      saveState: () => localStorage.setItem('auto_history', JSON.stringify(App.state.history)),
      getFormattedDate: () => {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        return `${day}/${month}/${year}`;
      },
      showToast: (message, type = 'success') => {
        const toast = App.$('#toast');
        toast.textContent = message;
        toast.className = `toast show ${type}`;
        setTimeout(() => toast.classList.remove('show'), 3000);
      },

      // Renderização da UI
      render: {
        all() {
          this.courses(); this.upcomingSim(); this.quickGuide(); this.recentExercises();
          this.stats(); this.exerciseList(); this.guidesArea(); this.simList();
          this.progressArea(); this.mobileNav();
        },
        setActiveSection(id) {
            App.state.view = id;
            App.$$('.view').forEach(v => v.style.display = 'none');
            App.$(`#${id}`).style.display = 'block';
            App.$$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.section === id));
            App.$('#pageTitle').textContent = id.charAt(0).toUpperCase() + id.slice(1);
        },
        courses(filter = '') {
            const listEl = App.$('#courseList'); listEl.innerHTML = '';
            const areaEl = App.$('#coursesArea'); areaEl.innerHTML = '';
            const filteredCourses = App.data.courses.filter(c => c.title.toLowerCase().includes(filter));

            // lista de cursos da pagina
            filteredCourses.slice(0, 4).forEach(c => {
                const div = document.createElement('div'); div.className = 'course';
                div.innerHTML = `<div class="thumb">${c.title.charAt(0)}</div><div class="info"><h4>${c.title}</h4><p class="muted">${c.desc}</p><div style="margin-top:8px"><div class="progress"><i style="width:${c.progress}%"></i></div></div></div>`;
                listEl.appendChild(div);
            });
            // pagina de cursos
            const cats = [...new Set(App.data.courses.map(c => c.cat))];
            cats.forEach(cat => {
                const coursesInCat = App.data.courses.filter(c => c.cat === cat);
                if (coursesInCat.length === 0) return;
                const box = document.createElement('div'); box.className = 'card'; box.style.marginBottom = '18px';
                box.innerHTML = `<h3>${cat.charAt(0).toUpperCase() + cat.slice(1)}</h3>`;
                const list = document.createElement('div'); list.className = 'list';
                coursesInCat.forEach(c => {
                    const item = document.createElement('div'); item.className = 'list-item';
                    item.innerHTML = `<div><strong>${c.title}</strong><div class='muted'>${c.desc}</div></div><div class='pill'>${c.progress}%</div>`;
                    list.appendChild(item);
                });
                box.appendChild(list);
                areaEl.appendChild(box);
            });
        },
        upcomingSim() {
            App.$('#upcomingSim').innerHTML = `<div class="list-item"><div><strong>Prova Teórica Oficial</strong><div class="muted">40 perguntas / 60 min</div></div><button class="btn" data-action="start-sim-40">Começar</button></div>`;
        },
        quickGuide() {
            const el = App.$('#quickGuide'); el.innerHTML = '';
            App.data.guides.forEach(g => {
                const item = document.createElement('div'); item.className = 'list-item';
                item.innerHTML = `<div><strong>${g.title}</strong></div><button class='btn secondary' data-action="open-guide" data-id="${g.id}">Ver</button>`;
                el.appendChild(item);
            });
        },
        recentExercises() {
            const el = App.$('#recentExercises'); el.innerHTML = '';
            if (App.state.history.length === 0) {
                el.innerHTML = `<p class="muted small">Nenhum exercício resolvido ainda.</p>`;
                return;
            }
            App.state.history.slice().reverse().slice(0, 3).forEach(h => {
                const div = document.createElement('div'); div.className = 'list-item';
                div.innerHTML = `<div><strong>${h.title.substring(0,25)}...</strong><div class='muted'>${h.score}% acertos</div></div><div class='pill ${h.score > 70 ? 'success' : ''}'>${h.date}</div>`;
                el.appendChild(div);
            });
        },
        stats() {
            const totalSims = App.state.history.length;
            const avgScore = totalSims ? Math.round(App.state.history.reduce((sum, item) => sum + item.score, 0) / totalSims) : 0;
            App.$('#avgProgress').style.width = `${avgScore}%`;
            App.$('#simCount').textContent = totalSims;
            App.$('#sidebarProgress').textContent = `${avgScore}%`;
        },
        exerciseList() {
             const el = App.$('#exList'); el.innerHTML = '';
             App.data.questions.forEach(q => {
                 const item = document.createElement('div'); item.className = 'list-item';
                 item.innerHTML = `<div><strong>${q.q}</strong><div class='muted'>Categoria: ${q.cat}</div></div><button class='btn' data-action="start-exercise" data-id="${q.id}">Resolver</button>`;
                 el.appendChild(item);
             });
        },
        guidesArea() {
            const el = App.$('#guidesArea'); el.innerHTML = '';
            App.data.guides.forEach(g => {
                const item = document.createElement('div'); item.className = 'list-item';
                item.innerHTML = `<div><strong>${g.title}</strong><div class="muted">${g.steps.length} passos</div></div><button class='btn' data-action="open-guide" data-id="${g.id}">Abrir</button>`;
                el.appendChild(item);
            });
        },
        simList() {
            const el = App.$('#simList'); el.innerHTML = '';
            [{q:10, t:15}, {q:20, t:30}, {q:40, t:60}].forEach(sim => {
                const item = document.createElement('div'); item.className = 'list-item';
                item.innerHTML = `<div><strong>Simulado Rápido (${sim.q}q)</strong><div class='muted'>Tempo estimado: ${sim.t} min</div></div><button class='btn' data-action="start-sim-${sim.q}">Iniciar</button>`;
                el.appendChild(item);
            });
        },
        progressArea() {
            // 
            const chartEl = App.$('#progressChartArea');
            chartEl.innerHTML = '<h3>Desempenho nos Simulados</h3>';
            const chartContainer = document.createElement('div');
            chartContainer.className = 'chart-container';
            App.state.history.slice(-10).forEach(h => {
                const bar = document.createElement('div');
                bar.className = 'chart-bar';
                bar.style.height = `${h.score}%`;
                bar.innerHTML = `<span class="tooltip">${h.score}% em ${h.date}</span>`;
                chartContainer.appendChild(bar);
            });
            chartEl.appendChild(chartContainer);
            // historico
            const historyEl = App.$('#progressHistoryArea');
            historyEl.innerHTML = '<h3>Histórico Completo</h3>';
            const list = document.createElement('div'); list.className = 'list';
            App.state.history.slice().reverse().forEach(h => {
                const item = document.createElement('div'); item.className = 'list-item';
                item.innerHTML = `<div><strong>${h.title}</strong><div class='muted'>${h.date}</div></div><div class="pill">${h.score}%</div>`;
                list.appendChild(item);
            });
            historyEl.appendChild(list);
        },
        mobileNav() {
            const nav = App.$('#mobileNav');
            nav.innerHTML = '';
            App.$$('.sidebar .nav-btn').forEach(btn => {
                if (['dashboard', 'cursos', 'exercicios', 'simulados'].includes(btn.dataset.section)) {
                    const mobileBtn = btn.cloneNode(true);
                    mobileBtn.innerHTML = btn.querySelector('i').outerHTML;
                    nav.appendChild(mobileBtn);
                }
            });
        },
    },

    // Ações e Lógica
    actions: {
        openPanel(title, contentHtml, showTimer = false) {
            App.$('#panelTitle').textContent = title;
            App.$('#panelBody').innerHTML = contentHtml;
            App.$('#timer').style.display = showTimer ? 'block' : 'none';
            App.$('#panel').classList.add('open');
        },
        closePanel() {
            App.$('#panel').classList.remove('open');
            if (App.state.simRunning) this.sim.finish();
        },
        toggleTheme() {
            App.state.theme = (App.state.theme === 'dark') ? 'light' : 'dark';
            document.body.classList.toggle('light', App.state.theme === 'light');
            localStorage.setItem('auto_theme', App.state.theme);
        },
        exercise: {
            start(id) {
                const q = App.data.questions.find(x => x.id === id);
                if (!q) return;
                const html = `<div class='question'><strong>${q.q}</strong></div><div class='answers'>${q.options.map((o, i) => `<div class='answer' data-idx='${i}'>${o}</div>`).join('')}</div><div style='margin-top:12px;display:flex;justify-content:space-between;align-items:center'><div class='small muted' id='resInfo'></div><div><button class='btn' data-action="submit-answer">Enviar</button></div></div>`;
                App.actions.openPanel('Exercício rápido', html);
                
                let selected = null;
                const answersContainer = App.$('#panelBody .answers');
                answersContainer.addEventListener('click', e => {
                    const answerEl = e.target.closest('.answer');
                    if (!answerEl) return;
                    App.$$('.answer', answersContainer).forEach(a => a.classList.remove('selected'));
                    answerEl.classList.add('selected');
                    selected = parseInt(answerEl.dataset.idx, 10);
                });
                
                App.$('[data-action="submit-answer"]').onclick = () => {
                    if (selected === null) { App.$('#resInfo').textContent = 'Selecione uma opção'; return; }
                    const correct = selected === q.answer;
                    App.$('#resInfo').textContent = correct ? 'Correto!' : 'Incorreto. Resposta: ' + q.options[q.answer];
                    App.state.history.push({ title: q.q, score: correct ? 100 : 0, date: App.getFormattedDate(), duration: 0 });
                    App.saveState(); App.render.recentExercises(); App.render.stats();
                    this.onclick = null; // correcao
                };
            },
        },
        sim: {
            start(totalQuestions) {
                if (App.state.simRunning) return App.showToast('Simulado já em andamento', 'error');
                const pool = [...App.data.questions];
                const chosen = Array.from({ length: Math.min(totalQuestions, pool.length) }, () => pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
                
                App.state.simRunning = true;
                App.state.currentSim = { questions: chosen, index: 0, correct: 0, total: chosen.length };
                App.state.simTimeLeft = chosen.length * 60; // 1 min per question
                
                this.renderQuestion();
                this.startTimer();
                App.render.setActiveSection('simulados');
            },
            renderQuestion() {
                const sim = App.state.currentSim; if (!sim) return;
                const q = sim.questions[sim.index];
                const html = `<div class='small muted'>Pergunta ${sim.index + 1} / ${sim.total}</div><div class='question'><strong>${q.q}</strong></div><div class='answers'>${q.options.map((o, i) => `<div class='answer' data-idx='${i}'>${o}</div>`).join('')}</div><div style='margin-top:12px;display:flex;justify-content:flex-end;align-items:center'><button class='btn' data-action="next-q">Próxima</button></div>`;
                App.actions.openPanel('Simulado', html, true);
            },
            nextQuestion(selectedIndex) {
                const sim = App.state.currentSim;
                if (selectedIndex === null) return;
                const q = sim.questions[sim.index];
                if (selectedIndex === q.answer) sim.correct++;
                
                sim.index++;
                if (sim.index >= sim.total) this.finish();
                else this.renderQuestion();
            },
            finish() {
                const sim = App.state.currentSim; if (!sim) return;
                const scorePct = Math.round((sim.correct / sim.total) * 100);
                App.state.history.push({ title: `Simulado (${sim.total}q)`, score: scorePct, date: App.getFormattedDate(), duration: (sim.total * 60 - App.state.simTimeLeft) });
                App.saveState(); App.render.all();
                this.clearTimer();
                App.state.simRunning = false; App.state.currentSim = null;
                App.actions.openPanel('Resultado', `<div><strong>Você acertou ${sim.correct} de ${sim.total} (${scorePct}%)</strong></div><div style='margin-top:12px'><button class='btn' data-action="close-panel">Fechar</button></div>`);
            },
            startTimer() {
                this.updateTimerDisplay();
                App.state.simTimer = setInterval(() => {
                    App.state.simTimeLeft--;
                    this.updateTimerDisplay();
                    if (App.state.simTimeLeft <= 0) {
                        clearInterval(App.state.simTimer);
                        this.finish();
                    }
                }, 1000);
            },
            clearTimer() {
                clearInterval(App.state.simTimer);
                App.state.simTimer = null;
                App.$('#timer').textContent = '';
            },
            updateTimerDisplay() {
                const t = App.state.simTimeLeft;
                const mm = String(Math.floor(t / 60)).padStart(2, '0');
                const ss = String(t % 60).padStart(2, '0');
                App.$('#timer').textContent = `${mm}:${ss}`;
            }
        },
        //tira essa porra daqui 
        openGuide(id) {
            const g = App.data.guides.find(x => x.id === id);
            if (!g) return;
            App.actions.openPanel(g.title, `<ol>${g.steps.map(s => `<li style='margin:8px 0'>${s}</li>`).join('')}</ol><div style='margin-top:12px'><button class='btn' data-action="close-panel">Fechar</button></div>`);
        }
    },
    
    // Inicialização
    init() {
        // Aplica o tema salvo
        document.body.classList.toggle('light', this.state.theme === 'light');

        // Renderiza toda a UI inicial
        this.render.all();

        // Configura os event listeners
        document.addEventListener('click', e => {
            const target = e.target.closest('[data-section], [data-action]');
            if (!target) return;

            const { section, action, id } = target.dataset;

            if (section) {
                e.preventDefault();
                this.render.setActiveSection(section);
            }
            if (action) {
                switch(action) {
                    case 'go-to-exercises': this.render.setActiveSection('exercicios'); break;
                    case 'start-sim-5': this.actions.sim.start(5); break;
                    case 'start-sim-10': this.actions.sim.start(10); break;
                    case 'start-sim-40': this.actions.sim.start(40); break;
                    case 'start-exercise': this.actions.exercise.start(parseInt(id, 10)); break;
                    case 'open-guide': this.actions.openGuide(id); break;
                    case 'close-panel': this.actions.closePanel(); break;
                    case 'next-q': {
                        const selected = App.$('.answer.selected');
                        this.actions.sim.nextQuestion(selected ? parseInt(selected.dataset.idx, 10) : null);
                        break;
                    }
                    case 'save-config': {
                        const name = App.$('#userName').value;
                        localStorage.setItem('auto_name', name);
                        this.showToast('Configurações salvas!');
                        break;
                    }
                }
            }
        });
        
        App.$('#themeToggle').addEventListener('click', () => this.actions.toggleTheme());
        App.$('#searchInput').addEventListener('input', e => this.render.courses(e.target.value.toLowerCase()));

        // Carrega dados salvos do utilizador
        App.$('#userName').value = localStorage.getItem('auto_name') || '';

        // Painel Lateral (seleção de resposta)
        App.$('#panelBody').addEventListener('click', e => {
            const answerEl = e.target.closest('.answer');
            if (answerEl) { // Lógica para destacar a resposta selecionada
                App.$$('.answer', App.$('#panelBody')).forEach(a => a.classList.remove('selected'));
                answerEl.classList.add('selected');
            }
        });
    }
  };

  document.addEventListener('DOMContentLoaded', () => App.init());