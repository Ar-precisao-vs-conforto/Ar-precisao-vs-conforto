// --- CONFIGURAÇÕES E CONSTANTES ---
// ATENÇÃO: A CHAVE DE API NÃO DEVE FICAR AQUI EM PRODUÇÃO!
// Idealmente, esta chamada deve ser feita por um backend.
const API_KEY = 'AIzaSyCAibA7S74hsrAgufalOZ_djkP_J5uijno'; // Substitua pela sua chave, mas lembre-se do risco de segurança.
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

// Fatores de cálculo
const WATTS_POR_PESSOA = 175;
const WATTS_ILUMINACAO_POR_M2 = 20;
const FATOR_TROCA_AR = 3.025 + 3.01;
const FATOR_TROCA_PAREDES = 8.8;
const WATTS_PARA_BTU = 3.412;
const FATOR_SENSIBILIDADE_CONFORTO = 0.65;
const FATOR_SENSIBILIDADE_PRECISAO = 0.90;
const CUSTO_MANUTENCAO_MENSAL_CONFORTO = 250; // Valor por equipamento
const CUSTO_MANUTENCAO_MENSAL_PRECISAO = 800; // Valor por equipamento
const CUSTO_INSTALACAO_CONFORTO = 1200;
const CUSTO_INSTALACAO_PRECISAO = 3800;

let tcoChartInstance = null;
let economiaInstance = null;

// --- FUNÇÕES DE INTERFACE DO USUÁRIO ---

/**
 * Exibe a aba especificada e ativa o botão correspondente.
 * @param {string} tabName - O nome da aba a ser exibida (ID do elemento).
 */
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    document.getElementById(`button-${tabName}`).classList.add('active');
}

/**
 * Coleta os valores dos campos de entrada do formulário.
 * Realiza uma validação básica para garantir que os valores sejam maiores que zero.
 * @returns {object|null} Um objeto com os valores de entrada ou null se a validação falhar.
 */
function getInputs() {
    const inputs = {
        area: parseFloat(document.getElementById('area').value) || 0,
        peDireito: parseFloat(document.getElementById('pe-direito').value) || 0,
        equipamentosTI: parseFloat(document.getElementById('equipamentos-ti').value) || 0,
        pessoas: document.getElementById('pessoas').value === '' ? null : parseInt(document.getElementById('pessoas').value, 10),
        custoEnergia: parseFloat(document.getElementById('custo-energia').value) || 0.55,
        horasDia: parseFloat(document.getElementById('horas-dia').value) || 0,
        diasMes: parseFloat(document.getElementById('dias-mes').value) || 0,
    };

    // Validação simples
    for (const key in inputs) {
        if (inputs[key] <= 0 && key != 'pessoas') {
            alert(`Por favor, insira um valor válido para ${key}.`);
            return null;
        }
    }

    if (inputs['pessoas'] === null || isNaN(inputs['pessoas'])) {
        alert(`Por favor, insira um valor válido para pessoas.`);
        return null;
    }
    return inputs;
}

/**
 * Atualiza os elementos da interface do usuário com os resultados dos cálculos.
 * @param {object} thermalLoad - Dados da carga térmica.
 * @param {object} geminiData - Dados retornados pela API Gemini.
 * @param {object} results - Resultados financeiros e de TCO.
 */
function updateUI(thermalLoad, geminiData, results) {
    const { ArConforto, ArPrecisao } = geminiData;

    const formatCurrency = (value) => 'R$ ' + value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formatCalculosVirgula = (value) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formatCalculos = (value) => value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    // Aba Cálculos  
    document.getElementById('carga-termica').textContent = formatCalculosVirgula(thermalLoad.cargaTermicaWatts / 1.2 / 1000) + ' Kw';
    document.getElementById('carga-seguranca').textContent = formatCalculosVirgula(thermalLoad.cargaTermicaWatts / 1000) + ' Kw';
    document.getElementById('carga-conforto').textContent = formatCalculos(thermalLoad.potenciaArConforto) + ' Btus';
    document.getElementById('carga-precisao').textContent = formatCalculos(thermalLoad.potenciaArPrecisao) + ' Btus';

    document.getElementById('quantidade-conforto').textContent = formatCalculos(ArConforto.quantidade) + ' Equipamentos';
    document.getElementById('capacidade-conforto').textContent = formatCalculos(ArConforto.potencia_btus) + ' Btus';
    document.getElementById('potencia-media-conforto').textContent = formatCalculos(ArConforto.potencia_btus / WATTS_PARA_BTU) + ' Watts';

    document.getElementById('quantidade-precisao').textContent = formatCalculos(ArPrecisao.quantidade) + ' Equipamentos';
    document.getElementById('capacidade-precisao').textContent = formatCalculos(ArPrecisao.potencia_btus) + ' Btus';
    document.getElementById('potencia-media-precisao').textContent = formatCalculos(ArPrecisao.potencia_btus / WATTS_PARA_BTU) + ' Watts';

    // Aba Resultados
    document.getElementById('equipamentos-conforto').textContent = formatCurrency(results.investEquipamentosConforto);
    document.getElementById('instalacao-conforto').textContent = formatCurrency(results.investInstalacaoConforto);
    document.getElementById('invest-conforto').textContent = formatCurrency(results.investConforto);
    document.getElementById('energia-conforto').textContent = formatCurrency(results.custoMensalEnergiaConforto);
    document.getElementById('manutencao-conforto').textContent = formatCurrency(results.custoMensalManutencaoConforto);
    document.getElementById('custo-mensal-conforto').textContent = formatCurrency(results.custoMensalConforto);

    document.getElementById('equipamentos-precisao').textContent = formatCurrency(results.investEquipamentosPrecisao);
    document.getElementById('instalacao-precisao').textContent = formatCurrency(results.investInstalacaoPrecisao);
    document.getElementById('invest-precisao').textContent = formatCurrency(results.investPrecisao);
    document.getElementById('energia-precisao').textContent = formatCurrency(results.custoMensalEnergiaPrecisao);
    document.getElementById('manutencao-precisao').textContent = formatCurrency(results.custoMensalManutencaoPrecisao);
    document.getElementById('custo-mensal-precisao').textContent = formatCurrency(results.custoMensalPrecisao);

    document.getElementById('investimento-adicional').textContent = formatCurrency(results.investimentoAdicional);
    document.getElementById('economia-anual').textContent = formatCurrency(results.economiaMensal * 12);   
    document.getElementById('payback').textContent = `${(results.payback).toFixed(1)} anos`;
    document.getElementById('economia-10-anos').textContent = formatCurrency(results.economiaMensal * 120);

    if (results.melhorAr == "precisao") {
        document.getElementById('ar-mais-vantajoso').textContent = 'Com ar condicionado de precisão';
        document.getElementById('investimento').textContent = 'Investimento Adicional';         
        document.getElementById('alerta-conforto').style.display = 'none';
    }

    if (results.melhorAr == "conforto") {
        document.getElementById('ar-mais-vantajoso').textContent = 'Com ar condicionado de conforto';
        document.getElementById('investimento').textContent = 'Economia no Investimento';  
        document.getElementById('alerta-conforto').style.display = 'block';
    }

    document.querySelector('.calculos-content').style.display = 'grid';
    document.querySelector('.results-grid').style.display = 'grid';
    document.querySelector('.apresentacao-resultados').style.display = 'block';   
    document.querySelectorAll('.chart-container').forEach(el => {
        el.style.display = 'block';
    });

    // Mosta aviso em todas abas
    document.querySelectorAll('.disclaimer-box').forEach(el => {
        el.style.display = 'block';
    });
}

/**
 * Alterna a exibição do estado de carregamento e mensagens de erro.
 * @param {boolean} isLoading - Se `true`, exibe a mensagem de carregamento; caso contrário, exibe o conteúdo principal.
 */
function toggleLoading(isLoading) {
    document.querySelector('.summary-metrics').style.display = isLoading ? 'none' : 'grid';
    document.getElementById('loading-message').style.display = isLoading ? 'block' : 'none';
    document.getElementById('loading-animation').style.display = isLoading ? 'block' : 'none';
    document.getElementById('error-message').style.display = 'none'; // Sempre esconde o erro ao iniciar
}

/**
 * Exibe a mensagem de erro e oculta outros elementos da interface.
 */
function showError() {
    document.querySelector('.summary-metrics').style.display = 'none';
    document.getElementById('loading-message').style.display = 'none';
    document.getElementById('error-message').style.display = 'block';
}

// --- FUNÇÕES DE CÁLCULO E LÓGICA DE NEGÓCIO ---

/**
 * Calcula a carga térmica total em Watts e BTUs.
 * @param {object} inputs - Os dados de entrada do usuário.
 * @returns {object} Um objeto contendo a carga térmica em Watts e a potência necessária para Ar Conforto e Ar Precisão em BTUs.
 */
function calculateThermalLoad(inputs) {
    const cargaTI = inputs.equipamentosTI * 1000;
    const cargaPessoas = inputs.pessoas * WATTS_POR_PESSOA;
    const cargaIluminacao = inputs.area * WATTS_ILUMINACAO_POR_M2;
    const cargaTrocaAr = (inputs.area * inputs.peDireito) * FATOR_TROCA_AR;
    const cargaTrocaParedes = ((Math.sqrt(inputs.area) * inputs.peDireito * 4) + inputs.area) * FATOR_TROCA_PAREDES;

    const cargaTermicaWatts = (cargaTI + cargaPessoas + cargaIluminacao + cargaTrocaAr + cargaTrocaParedes) * 1.2;
    const cargaTermicaBTUS = (cargaTermicaWatts * WATTS_PARA_BTU);

    return {
        cargaTermicaWatts,
        potenciaArConforto: Math.ceil(cargaTermicaBTUS / FATOR_SENSIBILIDADE_CONFORTO / 1000) * 1000,
        potenciaArPrecisao: Math.ceil(cargaTermicaBTUS / FATOR_SENSIBILIDADE_PRECISAO / 1000) * 1000,
    };
}

/**
 * Cria o prompt para a API Gemini com base nos dados de carga térmica.
 * @param {object} loadData - Dados da carga térmica calculada.
 * @returns {string} O prompt formatado em JSON.
 */
function createPrompt(loadData) {
    return `Você é um Engenheiro de Vendas Sênior de uma grande integradora de soluções de TI, especializado em dimensionar e cotar projetos de climatização para Data Centers no mercado brasileiro. Sua principal habilidade é a precisão técnica e comercial.
                **Missão Crítica:**
                Analise a carga térmica fornecida e dimensione as duas soluções de climatização (Conforto e Precisão) com o máximo de realismo para o mercado brasileiro atual. Sua resposta final deve ser **ÚNICA E EXCLUSIVAMENTE** um objeto JSON válido, sem nenhum texto ou formatação extra.
                ---
                **REGRAS E RACIOCÍNIO OBRIGATÓRIOS:**
                **1. Análise para Ar-Condicionado de Conforto:**
                    a. **Cálculo de Capacidade:** Com a "Carga Térmica para Ar Conforto" fornecida, selecione o modelo de ar condicionado de conforto padrão (18000, 24000, 30000, 36000, 48000, 57000 BTUs). Use a menor quantidade de máquinas possível, priorizando máquinas mais potentes para atender a carga.
                    b. **Cálculo de Quantidade (24/7):** Determine a quantidade de máquinas necessárias para cobrir a carga térmica. Em seguida, **triplique** esse número para garantir a operação 24/7 em regime de revezamento. Essa é a quantidade final.
                    c. **Pesquisa de Preço Realista:** Com base no modelo de BTU/h escolhido, pesquise em sua base de dados interna o preço unitário **realista** de um equipamento de **marca de primeira linha (ex: Fujitsu, Daikin, LG Inverter)** vendido por distribuidores especializados no Brasil. O valor deve ser numérico, sem "R$".                    
                    d. **Exemplo de dimensionamento:** carga térmica de 17000 BTUS, é necessário 1 ar de 18000, logo para trabalha 24/7 devem ter 3 ar de 18000 btus
                    e. verifique se o valor pesquisado está proximos dos valores médios de mercado, um boa aproixmação é 165.56x + 339.17, onde x é a poteencia em BTUS do ar condicionado.
                **2. Análise para Ar-Condicionado de Precisão:**
                    a. **Cálculo de Quantidade e Redundância (N+1):** Com a "Carga Térmica para Ar Precisão" fornecida, determine a menor quantidade de máquinas necessárias para cobrir a carga. Em seguida, **adicione uma (1) unidade** para redundância (N+1). Essa é a quantidade final. Use a menor quantidade de máquinas possível, priorizando máquinas mais potentes para atender a carga.
                    b. **Cálculo de Potência Individual:** Divida a carga térmica total pela quantidade de máquinas operantes (N) para obter a potência individual de cada equipamento.
                    c. **Pesquisa de Preço Realista:** Com base na potência individual calculada, pesquise em sua base de dados o preço unitário **realista** de um equipamento de precisão de **marcas renomadas (ex: Vertiv e Rittal)**.
                    
                ---
                **DADOS DE ENTRADA PARA ANÁLISE:**
                - Carga Térmica para Ar Conforto: ${loadData.potenciaArConforto} BTU/h
                - Carga Térmica para Ar Precisão: ${loadData.potenciaArPrecisao} BTU/h
                ---
                **FORMATO DE SAÍDA (OBRIGATÓRIO E SEM EXCEÇÕES):**
                Responda apenas com o objeto JSON abaixo. Não adicione comentários, explicações ou a formatação markdown \\\json.
                {
                    "ArConforto": {
                        "quantidade": <numero>,
                        "potencia_btus": <numero>,
                        "valor_unitario": <numero>
                    },
                    "ArPrecisao": {
                        "quantidade": <numero>,
                        "potencia_btus": <numero>,
                        "valor_unitario": <numero>
                    }
                }`;
}

/**
 * Calcula os resultados financeiros finais com base nos dados da carga térmica,
 * nos dados da API Gemini e nos inputs do usuário.
 * @param {object} geminiData - Dados retornados pela API Gemini.
 * @param {object} inputs - Dados de entrada do usuário.
 * @returns {object} Um objeto contendo todos os resultados financeiros e de TCO.
 */
function calculateFinalResults(geminiData, inputs) {
    const { ArConforto, ArPrecisao } = geminiData;

    const investEquipamentosConforto = ArConforto.quantidade * ArConforto.valor_unitario;
    const investEquipamentosPrecisao = ArPrecisao.quantidade * ArPrecisao.valor_unitario;

    //VERIFICAR NECESSIDADE DE "FILTRA RESPOSTA DA IA"
    /* if (investEquipamentosPrecisao < (investEquipamentosConforto * 2.5) || investEquipamentosPrecisao > (investEquipamentosConforto * 4)) {
         investEquipamentosPrecisao = investEquipamentosConforto * 3;
    }*/

    const investInstalacaoConforto = ArConforto.quantidade * CUSTO_INSTALACAO_CONFORTO;
    const investInstalacaoPrecisao = ArPrecisao.quantidade * CUSTO_INSTALACAO_PRECISAO;

    // Investimento
    const investConforto = investEquipamentosConforto + investInstalacaoConforto;
    const investPrecisao = investEquipamentosPrecisao + investInstalacaoPrecisao;
    const investimentoAdicional = investPrecisao - investConforto;

    // Consumo de Energia (kW)            
    // Conforto: 1/3 das máquinas funcionam por vez - VERIFICAR CALCULO CORRETO DE ACORDO COM DIMENSIONAMENTO
    const consumoHorarioConforto = (ArConforto.quantidade / 3) * (ArConforto.potencia_btus / WATTS_PARA_BTU / 1000);
    // Precisão: N máquinas funcionam (N = total - 1)
    const consumoHorarioPrecisao = (ArPrecisao.quantidade - 1) * (ArPrecisao.potencia_btus / WATTS_PARA_BTU / 1000);

    // Custo Mensal com Energia
    const horasMensais = inputs.horasDia * inputs.diasMes;
    const custoMensalEnergiaConforto = consumoHorarioConforto * horasMensais * inputs.custoEnergia;
    const custoMensalEnergiaPrecisao = consumoHorarioPrecisao * horasMensais * inputs.custoEnergia;

    // Custo Mensal com Manutenção
    const custoMensalManutencaoConforto = ArConforto.quantidade * CUSTO_MANUTENCAO_MENSAL_CONFORTO;
    const custoMensalManutencaoPrecisao = ArPrecisao.quantidade * CUSTO_MANUTENCAO_MENSAL_PRECISAO;

    // Custos mensais
    const custoMensalConforto = custoMensalEnergiaConforto + custoMensalManutencaoConforto;
    const custoMensalPrecisao = custoMensalEnergiaPrecisao + custoMensalManutencaoPrecisao;

    // Economia Mesal Total
    const economiaMensalEnergia = custoMensalEnergiaConforto - custoMensalEnergiaPrecisao;
    const economiaMensalManutencao = custoMensalManutencaoConforto - custoMensalManutencaoPrecisao;
    let economiaMensal = economiaMensalEnergia + economiaMensalManutencao;

    let payback;
    let melhorAr;

    if (economiaMensal > 0) {
        melhorAr = "precisao";
        payback = investPrecisao / (economiaMensal * 12);

    } else {
        melhorAr = "conforto";
        payback = investConforto / (-economiaMensal * 12);
        economiaMensal *= -1;
    }

    return {
        investEquipamentosConforto,
        investEquipamentosPrecisao,
        investInstalacaoConforto,
        investInstalacaoPrecisao,
        investConforto,
        investPrecisao,
        investimentoAdicional,
        custoMensalEnergiaConforto,
        custoMensalEnergiaPrecisao,
        custoMensalManutencaoConforto,
        custoMensalManutencaoPrecisao,
        custoMensalConforto,
        custoMensalPrecisao,
        economiaMensal,
        payback,
        melhorAr,
    };
}

// --- FUNÇÕES DE RENDERIZAÇÃO DE GRÁFICOS ---

/**
 * Renderiza o gráfico de TCO (Total Cost of Ownership) e o gráfico de economia acumulada.
 * @param {object} results - Os resultados financeiros para renderizar os gráficos.
 */
function renderTCOChart(results) {

    const interseccao = (results.investPrecisao - results.investConforto) / (results.custoMensalConforto*12 - results.custoMensalPrecisao*12);
    const tempo = interseccao * 2 + 1;

    console.log(interseccao);

    const years = Array.from({ length: tempo+1 }, (_, i) => i);

    const tcoConfortoData = years.map(year =>
        results.investConforto + (results.custoMensalConforto * 12 * year)
    );
    const tcoPrecisaoData = years.map(year =>
        results.investPrecisao + (results.custoMensalPrecisao * 12 * year)
    );


    const economiaAnos = years.map(year =>
        results.investimentoAdicional + (results.economiaAnual * year)
    );


    const ctx = document.getElementById('tcoChart').getContext('2d');
    const ctx2 = document.getElementById('grafico-economia').getContext('2d');

    // Destrua o gráfico antigo, se existir
    if (tcoChartInstance) {
        tcoChartInstance.destroy();
    }

    // Destrua o gráfico antigo, se existir
    if (economiaInstance) {
        economiaInstance.destroy();
    }



    tcoChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [
                {
                    label: 'Ar Conforto',
                    data: tcoConfortoData,
                    borderColor: 'rgb(52, 110, 216)', // Azul
                    backgroundColor: 'rgba(52, 110, 216, 0.2)', // Adicionado opacidade para o preenchimento
                    tension: 0.2, // linha suave
                    pointRadius: 2,
                    pointBackgroundColor: 'rgb(52, 110, 216)'
                },
                {
                    label: 'Ar Precisão',
                    data: tcoPrecisaoData,
                    borderColor: 'rgb(16, 223, 16)', // Verde
                    backgroundColor: 'rgba(16, 223, 16, 0.2)', // Adicionado opacidade para o preenchimento
                    tension: 0.2,
                    pointRadius: 2,
                    pointBackgroundColor: 'rgb(16, 223, 16)'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Evolução do TCO',
                    font: { size: 18, weight: 'bold' }
                },
                subtitle: {
                    display: true,
                    text: 'Custo total acumulado ao longo dos anos',
                    font: { size: 12 },
                    padding: {
                        bottom: 40
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.raw);
                            return label;
                        },
                        title: function (context) {
                            return `Ano ${context[0].label}`;
                        }
                    }
                },
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Tempo (anos)', font: { size: 12, weight: 'bold' } }
                },
                y: {
                    title: { display: true, text: 'Custo Acumulado (R$)', font: { size: 12, weight: 'bold' } },
                    beginAtZero: true
                }
            }
        }
    });

    economiaInstance = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: years,
            datasets: [
                {
                    data: economiaAnos,
                    borderColor: 'rgb(16, 223, 16)', // Verde
                    backgroundColor: 'rgba(16, 223, 16, 0.7)', // Adicionado opacidade para o preenchimento
                    tension: 0.2,
                    pointRadius: 2,
                    pointBackgroundColor: 'rgb(16, 223, 16)'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Economia acumulada',
                    font: { size: 18, weight: 'bold' }
                },
                subtitle: {
                    display: true,
                    text: 'Economia acumulada ao longo dos anos',
                    font: { size: 10 },
                    padding: {
                        bottom: 40
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.raw);
                            return label;
                        },
                        title: function (context) {
                            return `Ano ${context[0].label}`;
                        }
                    }
                },
                legend: {
                    display: false,
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Tempo (anos)', font: { size: 12, weight: 'bold' } }
                },
                y: {
                    title: { display: true, text: 'Economia acumulada (R$)', font: { size: 12, weight: 'bold' } },
                    beginAtZero: true
                }
            }
        }
    });
}

// --- FUNÇÃO PRINCIPAL DE CÁLCULO ---

/**
 * Função assíncrona para iniciar o cálculo do TCO.
 * Coleta as entradas, calcula a carga térmica, interage com a API Gemini,
 * calcula os resultados finais e atualiza a interface do usuário e os gráficos.
 */
async function calcularTCO() {

    if (document.activeElement) document.activeElement.blur();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const inputs = getInputs();
    if (!inputs) return;

    toggleLoading(true);

    try {
        const thermalLoad = calculateThermalLoad(inputs);
        const prompt = createPrompt(thermalLoad);

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const rawText = data.candidates[0].content.parts[0].text;
        const cleanedText = rawText.replace(/```json\n?|```/g, '');
        const geminiData = JSON.parse(cleanedText);

        const finalResults = calculateFinalResults(geminiData, inputs);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simula um atraso para UX

        renderTCOChart(finalResults);
        updateUI(thermalLoad, geminiData, finalResults);
        showTab('calculos');
        setTimeout(rolarParaAbas, 300);
    } catch (error) {
        console.error("Erro no processo de cálculo:", error);
        showError();
    } finally {
        toggleLoading(false);
    }
}

function rolarParaAbas() {
    const divAbas = document.querySelector('.tabs');
    if (divAbas) {
        divAbas.scrollIntoView({
            behavior: 'smooth',    // 'smooth' ou 'auto'
            block: 'start'         // 'start', 'center', 'end'
        });
    }
}

function adicionarEventListenersEnter() {
    const camposParametros = [
        'area',
        'pe-direito',
        'equipamentos-ti',
        'pessoas',
        'horas-dia',
        'dias-mes',
        'custo-energia'
    ];

    camposParametros.forEach(function (campoId) {
        const campo = document.getElementById(campoId);
        if (campo) {
            campo.addEventListener('keypress', function (event) {
                if (event.key === 'Enter' || event.keyCode === 13) {
                    event.preventDefault();
                    calcularTCO();
                }
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    adicionarEventListenersEnter();
});



// ========================================
// CORREÇÃO PARA TOOLTIPS EM iOS
// ========================================

/**
 * Detecta se é dispositivo touch
 */
function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Corrige tooltips para dispositivos iOS/touch
 */
function adicionarCorrecaoTooltipIOS() {
    if (isTouchDevice()) {
        const tooltips = document.querySelectorAll('.input-container .tooltip');

        tooltips.forEach(function (tooltip) {
            tooltip.addEventListener('click', function (event) {
                event.preventDefault();
                event.stopPropagation();

                const tooltipText = this.querySelector('.tooltip-text');
                const isVisible = tooltipText.style.visibility === 'visible';

                // Esconder todos os tooltips
                document.querySelectorAll('.tooltip-text').forEach(function (tt) {
                    tt.style.visibility = 'hidden';
                    tt.style.opacity = '0';
                });

                // Mostrar o atual se não estava visível
                if (!isVisible) {
                    tooltipText.style.visibility = 'visible';
                    tooltipText.style.opacity = '1';
                }
            });
        });

        // Fechar tooltips ao clicar fora
        document.addEventListener('click', function (event) {
            if (!event.target.closest('.tooltip')) {
                document.querySelectorAll('.tooltip-text').forEach(function (tt) {
                    tt.style.visibility = 'hidden';
                    tt.style.opacity = '0';
                });
            }
        });
    }
}

// Chamar a função de correção de tooltip no DOMContentLoaded
document.addEventListener('DOMContentLoaded', function () {
    adicionarCorrecaoTooltipIOS();
});


