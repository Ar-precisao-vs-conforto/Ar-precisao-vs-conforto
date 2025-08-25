// Fatores de cálculo
const WATTS_POR_PESSOA = 175;
const WATTS_ILUMINACAO_POR_M2 = 0;
const FATOR_TROCA_AR = 3.025 + 3.01;
const FATOR_TROCA_PAREDES = 8.8;
const WATTS_PARA_BTU = 3.412;
const FATOR_SENSIBILIDADE_CONFORTO = 0.65;
const FATOR_SENSIBILIDADE_PRECISAO = 0.90;
const CUSTO_MANUTENCAO_MENSAL_CONFORTO = 0.03; // Valor por BTU
const CUSTO_MANUTENCAO_MENSAL_PRECISAO = 0.0175; // Valor por BTU
const CUSTO_INSTALACAO_CONFORTO = 2500;
const CUSTO_INSTALACAO_PRECISAO = 20000;
const CUSTO_MATERIAIS_CONFORTO = 2000;
const CUSTO_MATERIAIS_PRECISAO = 15000;


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
        custoEnergia: parseFloat(document.getElementById('custo-energia').value) || 0.75,
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
    document.getElementById('carga-termica').textContent = formatCalculosVirgula(thermalLoad.cargaTermicaWatts / 1000) + ' Kw';
    document.getElementById('carga-btus').textContent = formatCalculos(thermalLoad.cargaTermicaWatts * WATTS_PARA_BTU) + ' Btus';

    document.getElementById('quantidade-conforto').textContent = formatCalculos(ArConforto.quantidade) + ' Equipamentos';
    document.getElementById('capacidade-conforto').textContent = formatCalculos(ArConforto.potencia_btus) + ' Btus';
    document.getElementById('potencia-media-conforto').textContent = formatCalculosVirgula(ArConforto.potencia_btus * ArConforto.quantidade / 2 / WATTS_PARA_BTU / 1000) + ' Kw';

    document.getElementById('quantidade-precisao').textContent = formatCalculos(ArPrecisao.quantidade) + ' Equipamentos';
    document.getElementById('capacidade-precisao').textContent = formatCalculos(ArPrecisao.potencia_btus) + ' Btus';
    document.getElementById('potencia-media-precisao').textContent = formatCalculosVirgula((ArPrecisao.potencia_btus * (ArPrecisao.quantidade - 1)) / WATTS_PARA_BTU / 1000) + ' Kw';

    // Aba Resultados
    document.getElementById('equipamentos-conforto').textContent = formatCurrency(results.investEquipamentosConforto);
    document.getElementById('materiais-conforto').textContent = formatCurrency(results.investInfraConforto);
    document.getElementById('instalacao-conforto').textContent = formatCurrency(results.investInstalacaoConforto);
    document.getElementById('invest-conforto').textContent = formatCurrency(results.investConforto);
    document.getElementById('energia-conforto').textContent = formatCurrency(results.custoMensalEnergiaConforto);
    document.getElementById('manutencao-conforto').textContent = formatCurrency(results.custoMensalManutencaoConforto);
    document.getElementById('custo-mensal-conforto').textContent = formatCurrency(results.custoMensalConforto);

    document.getElementById('equipamentos-precisao').textContent = formatCurrency(results.investEquipamentosPrecisao);
    document.getElementById('materiais-precisao').textContent = formatCurrency(results.investInfraPrecisao);
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

    const cargaTermicaWatts = (cargaTI + cargaPessoas + cargaIluminacao + cargaTrocaAr + cargaTrocaParedes);
    const cargaTermicaBTUS = (cargaTermicaWatts * WATTS_PARA_BTU);

    return {
        cargaTermicaWatts,
        potenciaArConforto: Math.ceil(cargaTermicaBTUS / 1000) * 1000,
        potenciaArPrecisao: Math.ceil(cargaTermicaBTUS * 0.7 / 1000) * 1000,
    };
}

/**
 * Calcula os resultados financeiros finais com base nos dados da carga térmica,
 * nos dados da API Gemini e nos inputs do usuário.
 * @param {object} geminiData - Dados retornados pela API Gemini.
 * @param {object} inputs - Dados de entrada do usuário.
 * @returns {object} Um objeto contendo todos os resultados financeiros e de TCO.
 */
function calculateFinalResults(geminiData, inputs, cargaTermica) {
    const { ArConforto, ArPrecisao } = geminiData;
    const fatorDeConsumo = cargaTermica.potenciaArPrecisao / (ArPrecisao.potencia_btus * (ArPrecisao.quantidade - 1));

    const investEquipamentosConforto = ArConforto.quantidade * ArConforto.valor_unitario;
    const investEquipamentosPrecisao = ArPrecisao.quantidade * ArPrecisao.valor_unitario;

    const comflex = parseInt(ArConforto.quantidade / 2) * 15000;

    const investInfraConforto = (ArConforto.quantidade * CUSTO_MATERIAIS_CONFORTO) + comflex;
    const investInfraPrecisao = ArPrecisao.quantidade * CUSTO_MATERIAIS_PRECISAO;

    const investInstalacaoConforto = ArConforto.quantidade * CUSTO_INSTALACAO_CONFORTO;
    const investInstalacaoPrecisao = ArPrecisao.quantidade * CUSTO_INSTALACAO_PRECISAO;

    // Investimento
    const investConforto = investEquipamentosConforto + investInfraConforto + investInstalacaoConforto;
    const investPrecisao = investEquipamentosPrecisao + investInfraPrecisao + investInstalacaoPrecisao;
    const investimentoAdicional = investPrecisao - investConforto;

    // Consumo de Energia (kW)            
    const consumoHorarioConforto = (ArConforto.quantidade / 2) * (ArConforto.potencia_btus / WATTS_PARA_BTU / 1000);
    const consumoHorarioPrecisao = (ArPrecisao.quantidade - 1) * (ArPrecisao.potencia_btus * fatorDeConsumo * 0.5 / WATTS_PARA_BTU / 1000);

    // Custo Mensal com Energia
    const horasMensais = inputs.horasDia * inputs.diasMes;
    const custoMensalEnergiaConforto = consumoHorarioConforto * horasMensais * inputs.custoEnergia;
    const custoMensalEnergiaPrecisao = consumoHorarioPrecisao * horasMensais * inputs.custoEnergia;

    const trocaConforto = (investConforto - comflex) / 48;

    // Custo Mensal com Manutenção
    const custoMensalManutencaoConforto = (ArConforto.quantidade * ArConforto.potencia_btus * CUSTO_MANUTENCAO_MENSAL_CONFORTO) + trocaConforto;
    const custoMensalManutencaoPrecisao = ArPrecisao.quantidade * ArPrecisao.potencia_btus * CUSTO_MANUTENCAO_MENSAL_PRECISAO;

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
        investInfraConforto,
        investInfraPrecisao,
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

    const interseccaoTCO = (results.investPrecisao - results.investConforto) / (results.custoMensalConforto * 12 - results.custoMensalPrecisao * 12);
    const tempoTCO = interseccaoTCO * 2 + 1;
    const tempoECO = 15;

    const yearsTCO = Array.from({ length: interseccaoTCO > 0 ? (tempoTCO + 1) : 11 }, (_, i) => i);
    const yearsECO = Array.from({ length: tempoECO + 1 }, (_, i) => i);

    const tcoConfortoData = yearsTCO.map(year =>
        results.investConforto + (results.custoMensalConforto * 12 * year)
    );
    const tcoPrecisaoData = yearsTCO.map(year =>
        results.investPrecisao + (results.custoMensalPrecisao * 12 * year)
    );


    let multiplicador = 1;
    if (results.melhorAr == "precisao") {
        multiplicador = -1;
    }

    const economiaAnos = yearsECO.map(year =>
        results.investimentoAdicional * multiplicador + (results.economiaMensal * 12 * year)
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
            labels: yearsTCO,
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
            labels: yearsECO,
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

const LEAD_COLLECTED_KEY = 'leadCollected';
const LEAD_COLLECTED_EXPIRATION_DAYS = 2;

/**
 * Define um cookie com um nome, valor e número de dias de expiração.
 * @param {string} name - O nome do cookie.
 * @param {string} value - O valor do cookie.
 * @param {number} days - O número de dias para o cookie expirar.
 */
function setCookie(name, value, days) {
    const d = new Date();
    //d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    d.setTime(d.getTime() + (60 * 1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

/**
 * Obtém o valor de um cookie pelo nome.
 * @param {string} name - O nome do cookie a ser obtido.
 * @returns {string} O valor do cookie ou uma string vazia se não for encontrado.
 */
function getCookie(name) {
    const cname = name + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(cname) === 0) {
            return c.substring(cname.length, c.length);
        }
    }
    return "";
}



/**
 * Exibe o pop-up de coleta de leads.
 */
function showLeadPopup() {
    document.getElementById('lead-popup').style.display = 'flex';
}

/**
 * Oculta o pop-up de coleta de leads.
 */
function hideLeadPopup() {
    document.getElementById('lead-popup').style.display = 'none';
}

async function handleLeadFormSubmit(event) {
    // Impede que o form recarregue a página
    event.preventDefault();     
    const name = document.getElementById('lead-name').value;
    const email = document.getElementById('lead-email').value;
    const phone = document.getElementById('lead-phone').value;
    const empresa = document.getElementById('lead-empresa').value;


    // ==== VALIDAÇÕES ====
    if (!name) {
        alert("Por favor, digite seu nome.");
        return;
    }

    // Validação simples de e-mail (formato básico)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        alert("Digite um e-mail válido.");
        return;
    }

    // Validação de telefone (apenas números, com mínimo de 8 dígitos)
    const phoneRegex = /^[0-9]{8,15}$/;
    if (!phone || !phoneRegex.test(phone)) {
        alert("Digite um telefone válido).");
        return;
    }

    if (!empresa) {
        alert("Por favor, digite o nome da empresa.");
        return;
    }

    const leadData = {
        fields: [
            { name: "firstname", value: name },
            { name: "email", value: email },
            { name: "telefone_do_lead", value: phone },
            { name: "company", value: empresa }
        ],
        context: {
            pageUri: window.location.href,
            pageName: document.title
        }
    };

    // 🔑 SEUS IDs DO HUBSPOT (pegos no código de incorporação do form)
    const PORTAL_ID = "2101665"; // substitua pelo seu portalId
    const FORM_ID = "3a321109-8f5c-4b7b-882c-9e67ab0d7d94"; // substitua pelo seu formId


    

    try {
        const response = await fetch(`https://api.hsforms.com/submissions/v3/integration/submit/${PORTAL_ID}/${FORM_ID}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(leadData)
        });

        if (response.ok) {
            console.log("Lead enviado com sucesso para o HubSpot!");
        } else {
            console.error("Erro ao enviar lead:", await response.text());
        }
    } catch (error) {
        console.error("Erro de rede:", error);
    }       

    // Armazena os dados localmente como backup
    localStorage.setItem('leadData', JSON.stringify(leadData));

    setCookie(LEAD_COLLECTED_KEY, 'true', LEAD_COLLECTED_EXPIRATION_DAYS);
    hideLeadPopup();
}




// --- FUNÇÃO PRINCIPAL DE CÁLCULO ---

/**
 * Função assíncrona para iniciar o cálculo do TCO.
 * Coleta as entradas, calcula a carga térmica, interage com a API Gemini,
 * calcula os resultados finais e atualiza a interface do usuário e os gráficos.
 */
async function calcularTCO() {   


    

    const inputs = getInputs();
    if (!inputs) return;

    if (getCookie(LEAD_COLLECTED_KEY) !== 'true') {
        showLeadPopup();
        return;
    }  

    if (document.activeElement) document.activeElement.blur();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    toggleLoading(true);

    try {
        const thermalLoad = calculateThermalLoad(inputs);

        const conforto = dimensionamentoConforto(thermalLoad);
        const precisao = dimensionamentoPrecisao(thermalLoad);

        const response = {
            candidates: [
                {
                    content: {
                        parts: [
                            {
                                text: JSON.stringify({
                                    "ArConforto": {
                                        "quantidade": conforto.qtd,
                                        "potencia_btus": conforto.potencia,
                                        "valor_unitario": conforto.valor
                                    },
                                    "ArPrecisao": {
                                        "quantidade": precisao.qtd,
                                        "potencia_btus": precisao.potencia,
                                        "valor_unitario": precisao.valor
                                    }
                                })
                            }
                        ]
                    }
                }
            ]
        };

        const data = response;
        const rawText = data.candidates[0].content.parts[0].text;
        const cleanedText = rawText.replace(/```json\n?|```/g, '');
        const geminiData = JSON.parse(cleanedText);

        const finalResults = calculateFinalResults(geminiData, inputs, thermalLoad);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simula um atraso para UX

        gerarGraficoPaybackPorCargaTI();

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

    if (getCookie(LEAD_COLLECTED_KEY) !== 'true') {
        showLeadPopup();
        return;
    }
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


function dimensionamentoConforto(thermalLoad) {

    const potencias = new Array(18000, 24000, 30000, 36000, 48000, 57000);
    const valores = new Array(3200, 4600, 5200, 6800, 8100, 9600);

    let potencia;
    let qtd = 0;
    let valor;

    let dimenssionado = false;
    while (!dimenssionado) {

        qtd++;

        let i = 0;
        while (i < 6) {
            if (potencias[i] * qtd >= thermalLoad.potenciaArConforto) {
                potencia = potencias[i];
                valor = valores[i];
                i = 6;
                dimenssionado = true;
            }
            i++;
        }
    }

    //para trabalhar alternado de 6 em 6 horas
    qtd = qtd * 2;

    return {
        potencia,
        qtd,
        valor,
    }
}


function dimensionamentoPrecisao(thermalLoad) {

    const potencias = new Array(10000, 15000, 21000, 40000, 51000, 70000);

    let potencia;
    let qtd = 0;
    let valor;

    let dimenssionado = false;
    while (!dimenssionado) {

        qtd++;

        let i = 0;
        while (i < 6) {
            if (potencias[i] * qtd >= thermalLoad.potenciaArPrecisao) {
                potencia = potencias[i];
                valor = 42651 * Math.log(potencia) - 329404;
                i = 6;
                dimenssionado = true;
            }
            i++;
        }
    }

    //redundancia
    qtd = qtd + 1;

    return {
        potencia,
        qtd,
        valor,
    }
}

function plotarGraficoPayback(cargasTI, paybacks) {
    const ctx = document.getElementById('grafico-payback-ti').getContext('2d');

    if (window.paybackChartInstance) {
        window.paybackChartInstance.destroy();
    }

    window.paybackChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: cargasTI,
            datasets: [{
                label: 'Payback (anos)',
                data: paybacks,
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                tension: 0.3,
                pointRadius: 1,
                fill: true,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Payback vs Carga de TI (kW)'
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `Payback: ${context.raw.toFixed(2)} anos`;
                        },
                        title: function (context) {
                            return `Carga TI: ${context[0].label} kW`;
                        }
                    }
                },
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Carga de TI (kW)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Payback (anos)'
                    },
                    beginAtZero: true
                }
            }
        }
    });
}


async function gerarGraficoPaybackPorCargaTI() {
    const paybacks = [];
    const cargasTI = [];

    for (let cargaTI_kW = 1; cargaTI_kW <= 100; cargaTI_kW++) {
        const inputs = {
            area: 20, // você pode ajustar
            peDireito: 3,
            equipamentosTI: cargaTI_kW,
            pessoas: 0,
            custoEnergia: 0.75,
            horasDia: 24,
            diasMes: 30,
        };

        const thermalLoad = calculateThermalLoad(inputs);
        const conforto = dimensionamentoConforto(thermalLoad);
        const precisao = dimensionamentoPrecisao(thermalLoad);

        const geminiData = {
            ArConforto: {
                quantidade: conforto.qtd,
                potencia_btus: conforto.potencia,
                valor_unitario: conforto.valor
            },
            ArPrecisao: {
                quantidade: precisao.qtd,
                potencia_btus: precisao.potencia,
                valor_unitario: precisao.valor
            }
        };

        const results = calculateFinalResults(geminiData, inputs, thermalLoad);

        cargasTI.push(cargaTI_kW);
        paybacks.push(results.payback);
    }

    plotarGraficoPayback(cargasTI, paybacks);
}