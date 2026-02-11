//expirar login
let tempoLimite = 25 * 60 * 1000;
let timer;

function resetTimer() {
    clearTimeout(timer);
    timer = setTimeout(logout, tempoLimite);
}





// Configuração Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBag5uPzTK0sXx3nBzjGhmlmSCySO3u3_U",
    authDomain: "rotinas-8498d.firebaseapp.com",
    projectId: "rotinas-8498d",
    storageBucket: "rotinas-8498d.firebasestorage.app",
    messagingSenderId: "1053551077085",
    appId: "1:1053551077085:web:4b2dcbbeb60f9f7fee1d34"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

function login() {
    const login = document.querySelector('#usuario').value.trim();
    const senha = document.querySelector('#senha').value;
    const manterConectado = document.querySelector('#manterConectadoCheck').checked;
    const tela_aviso = document.querySelector('#tela_aviso');
    tela_aviso.innerText = '';

    if (!login || !senha) {
        tela_aviso.innerText = 'Preencha usuário e senha.';
        return;
    }

    db.collection('users').doc(login).get()
        .then((doc) => {
            if (!doc.exists) {
                tela_aviso.innerText = 'Usuário não encontrado.';
                return;
            }

            const dados = doc.data();
            const hashSalvo = dados.senha;

            // Criar hash da senha digitada para comparar
            const senhaHash = CryptoJS.SHA256(senha).toString();

            if (senhaHash !== hashSalvo) {
                tela_aviso.innerText = 'Senha incorreta.';
                return;
            }

            // Verifica se a senha é a padrão '12345' (hash dela)
            const hashSenhaPadrao = CryptoJS.SHA256('12345').toString();

            if (hashSalvo === hashSenhaPadrao) {
                // Primeiro acesso
                document.querySelector('#primeiro_acesso').style.display = '';
                document.querySelector('#login').style.display = 'none';
                sessionStorage.setItem('primeiro_acesso', doc.id);
            } else {
                // Acesso normal
                document.querySelector('#programa').style.display = '';
                document.querySelector('#login').style.display = 'none';
                sessionStorage.setItem('usuario_logado', JSON.stringify(dados));
                document.querySelector('#saudacoes').innerHTML = `Olá, GCM ${JSON.parse(sessionStorage.getItem('usuario_logado')).nome}.`;
                document.querySelectorAll("#rotinas_table tbody tr,#chamadas_table tbody tr,#setores_table tbody tr").forEach(tr => {
                    tr.setAttribute('name', JSON.parse(sessionStorage.getItem('usuario_logado')).nome + '-**-' + new Date().getTime());
                });
                if (manterConectado) localStorage.setItem('manterConectado', 'sim');

                if (!localStorage.getItem('manterConectado')) {
                    // Eventos que contam como atividade
                    ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(evt => {
                        const hora = (new Date).getHours();
                        if (hora != 18 || hora != 6) {
                            document.addEventListener(evt, resetTimer);
                        }
                    });
                }
            }
        })
        .catch((error) => {
            console.error("Erro ao buscar usuário:", error);
            tela_aviso.innerText = 'Erro ao acessar o sistema.';
        });
}


function primeiro_acesso() {
    const senha_primeiro_acesso = document.querySelector('#senha_primeiro_acesso').value;
    const repetir_senha = document.querySelector('#repetir_senha_primeiro_acesso').value;
    const tela_aviso = document.querySelector('#tela_aviso_primeiro_acesso');
    const userId = sessionStorage.getItem('primeiro_acesso');

    tela_aviso.innerText = '';

    if (!senha_primeiro_acesso || !repetir_senha) {
        tela_aviso.innerText = "Preencha todos os campos.";
        return;
    }

    if (senha_primeiro_acesso !== repetir_senha) {
        tela_aviso.innerText = "As senhas não coincidem.";
        return;
    }

    if (senha_primeiro_acesso === '12345') {
        tela_aviso.innerText = "Por favor, escolha uma senha mais segura que '12345'.";
        return;
    }

    // Cria hash SHA-256 da senha nova
    const hash = CryptoJS.SHA256(senha_primeiro_acesso).toString();

    // Atualiza senha no Firestore
    db.collection('users').doc(userId).update({ senha: hash })
        .then(() => {
            return db.collection('users').doc(userId).get();
        })
        .then((doc) => {
            if (doc.exists) {
                const nome = doc.data().nome || "Usuário";
                sessionStorage.setItem('usuario_logado', nome);

                document.querySelector('#programa').style.display = 'none';
                document.querySelector('#login').style.display = '';
                document.querySelector('#primeiro_acesso').style.display = 'none';
                sessionStorage.removeItem('primeiro_acesso');
                sessionStorage.removeItem('usuario_logado');
            } else {
                console.warn("Usuário não encontrado após atualização.");
            }
        })
        .catch((error) => {
            console.error("Erro ao salvar a senha:", error);
            tela_aviso.innerText = "Erro ao salvar a senha.";
        });
}

function logout() {
    sessionStorage.clear();
    window.location.reload();
}

function baixa_banco() {
    //baixar os dados de qths, gus, qru
    db.collection("dados_fixos").onSnapshot((snapshot) => {
        snapshot.forEach((doc) => {
            localStorage.setItem(doc.id, JSON.stringify(doc.data()).replace(/\n/g, "<br>"));
            // Armazenar os dados do documento no localStorage

            if (doc.data().qth) {
                document.querySelectorAll('#setores_table tbody tr').forEach(linha => {
                    if (!doc.data().qth.includes(linha.getAttribute('name')) && linha.querySelectorAll('td')[1].innerText != '' && linha.querySelectorAll('td')[2].innerText != '') {
                        linha.remove();
                    }
                });
                let linhas = '';
                doc.data().qth.replace(/\n/g, "<br>").split('-++-').forEach(setor => {
                    if (!setor) return;

                    const celulas = setor.split('-()-');
                    const l = criar_linha('setores', celulas);
                    const lin = document.querySelector(`#setores_table tr[name='${celulas[0]}']`);
                    if (lin) {

                        if (lin.querySelectorAll('td')[1].innerText.trim().replaceAll('  ', ' ') != celulas[1].trim().replaceAll('  ', ' ') || lin.querySelectorAll('td')[2].innerText.trim().replaceAll('  ', ' ') != celulas[4].trim().replaceAll('  ', ' ') || lin.querySelectorAll('td')[3].innerText.trim().replaceAll('  ', ' ') != celulas[2].trim().replaceAll('  ', ' ') || lin.querySelectorAll('td')[4].innerText.trim().replaceAll('  ', ' ') != celulas[5].trim().replaceAll('  ', ' ') || lin.querySelectorAll('td')[5].innerText.trim().replaceAll('  ', ' ') != celulas[3].trim().replaceAll('  ', ' ')) {
                            document.querySelector(`#setores_table tr[name='${celulas[0]}']`).outerHTML = l;
                        }
                    } else {
                        linhas += l;
                    }
                })
                document.querySelector('#setores_table tbody').insertAdjacentHTML('afterbegin', linhas);
            } else if (doc.data().chamadas_pre_prontas) {
                document.querySelectorAll('#chamadas_pre_prontas_table tbody tr').forEach(linha => {
                    if (!doc.data().chamadas_pre_prontas.includes(linha.getAttribute('name')) && linha.querySelectorAll('td')[1].innerText.trim() != '' && linha.querySelectorAll('td')[2].innerText.trim() != '') {
                        linha.remove();
                    }
                });
                let linhas = '';
                doc.data().chamadas_pre_prontas.replace(/\n/g, "<br>").split('-++-').forEach(setor => {
                    if (!setor) return;

                    const celulas = setor.split('-()-');
                    const l = criar_linha('chamadas_pre_prontas', celulas);
                    const lin = document.querySelector(`#chamadas_pre_prontas_table tr[name='${celulas[0]}']`);
                    if (lin) {
                        if (lin.querySelectorAll('td')[1].innerText.trim().replaceAll('  ', ' ') != celulas[1].trim().replaceAll('  ', ' ') || lin.querySelectorAll('td')[2].innerText.trim().replaceAll('  ', ' ') != celulas[4].trim().replaceAll('  ', ' ') || lin.querySelectorAll('td')[3].innerText.trim().replaceAll('  ', ' ') != celulas[2].trim().replaceAll('  ', ' ') || lin.querySelectorAll('td')[4].innerText.trim().replaceAll('  ', ' ') != celulas[5].trim().replaceAll('  ', ' ') || lin.querySelectorAll('td')[5].innerText.trim().replaceAll('  ', ' ') != celulas[3].trim().replaceAll('  ', ' ')) {
                            document.querySelector(`#chamadas_pre_prontas_table tr[name='${celulas[0]}']`).outerHTML = l;
                        }
                    } else {
                        linhas += l;
                    }
                })
                document.querySelector('#chamadas_pre_prontas_table tbody').insertAdjacentHTML('afterbegin', linhas);
            }
        });
    }), (error) => {
        console.log("Erro ao buscar documentos: ", error);
    }
    if (JSON.parse(sessionStorage.getItem('usuario_logado')).credencial == '3') {
        db.collection('users').get()
            .then((querySnapshot) => {
                if (querySnapshot.empty) {
                    console.log("Nenhum usuário encontrado.");
                    return;
                }
                let linhas = '';
                querySnapshot.forEach((doc) => {
                    const dados = doc.data();
                    const celulas = [doc.id, dados.nome, dados.credencial, dados.senha];
                    linhas += criar_linha('usuários', celulas);
                });
                document.querySelector('#usuários tbody').insertAdjacentHTML('afterbegin', linhas);
            })
            .catch((error) => {
                console.error("Erro ao buscar usuários:", error);
            });
    }
}

function escaparHTML(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function criar_linha(aba, dados) {
    let linha;
    let copiado;
    if (localStorage.getItem('copiados')?.includes(dados[0])) {
        copiado = 'copiar_clicado';
    } else {
        copiado = 'copiar';
    }
    let borracha = '';
    let rapido = '';
    let content_editable = false;
    if (!dados[0].toString().includes('-**-') || (aba != 'usuários' && (dados[0].split('-**-')[0] == JSON.parse(sessionStorage.getItem('usuario_logado')).nome || JSON.parse(sessionStorage.getItem('usuario_logado')).credencial != '1'))) {
        borracha = `<svg class="borracha" onclick="excluir_linha(this,false)" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="17px" height="17px" viewBox="0 0 15 15" version="1.1">
                            <g id="surface1">
                                <path style=" stroke:none;fill-rule:nonzero;fill-opacity:1;" d="M 3.28125 12.65625 L 14.0625 12.65625 L 14.0625 13.59375 L 3.28125 13.59375 Z M 3.28125 12.65625 "/>
                                <path style=" stroke:none;fill-rule:nonzero;fill-opacity:1;" d="M 12.835938 4.925781 L 9.117188 1.214844 C 8.941406 1.039062 8.703125 0.9375 8.453125 0.9375 C 8.207031 0.9375 7.964844 1.039062 7.789062 1.214844 L 1.226562 7.777344 C 1.050781 7.953125 0.953125 8.191406 0.953125 8.441406 C 0.953125 8.6875 1.050781 8.925781 1.226562 9.101562 L 3.34375 11.25 L 7.835938 11.25 L 12.835938 6.253906 C 13.011719 6.078125 13.109375 5.839844 13.109375 5.589844 C 13.109375 5.339844 13.011719 5.101562 12.835938 4.925781 Z M 7.449219 10.3125 L 3.75 10.3125 L 1.875 8.4375 L 4.832031 5.480469 L 8.550781 9.191406 Z M 9.210938 8.550781 L 5.5 4.832031 L 8.4375 1.875 L 12.1875 5.59375 Z M 9.210938 8.550781 "/>
                            </g>
                        </svg>`;
        if (aba != 'chamadas_pre_prontas') {
            rapido = `<svg class="msg_rapida" onclick="msg_rapida(this)" version="1.0" xmlns="http://www.w3.org/2000/svg" width="17px" height="17px" viewBox="0 0 512.000000 512.000000" preserveAspectRatio="xMidYMid meet">
                        <g transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)" fill="#000000" stroke="none">
                            <path d="M1795 4928 c-21 -19 -110 -260 -485 -1321 -330 -932 -458 -1305 -454 -1323 3 -13 18 -33 31 -44 25 -20 43 -20 745  20 l720 0 29 -29 c16 -16 29 -38 29 -48 0 -10 -125 -453 -277 -985 -274 -956 -288 -1011 -244 -983 7 3 532 617 1168 1363 636 746 1168 1369 1182 1385 35 39 34 91 -3 123 l-27 24 -734 0 c-517 0 -741 3 -758 11 -32 15 -51 50 -45 86 2 16 223 398 491 850 341 576 487 830 487 850 -1 32 -15 55 -47 71 -16 9 -252 12 -902 12 l-880 0 -26 -22z" />
                        </g>
                    </svg>`
        }
        content_editable = true;
    }
    if (aba == 'rotinas') {
        linha = `<tr name="${dados[0]}" >
                <td style="width: 10px;" dados="${escaparHTML(dados[1])}-()-${escaparHTML(dados[2])}-()-${escaparHTML(dados[3])}-()-${escaparHTML(dados[4])}-()-${escaparHTML(dados[5])}-()-_QRA_-()-_QTR_INICIAL_-()-_QRU_-()-_QTR_FINAL_-()-${escaparHTML(dados[10])}-()-${escaparHTML(dados[11])}" >
                    <span class="icon-wrapper" style="display: inline-flex; gap: 4px; align-items: center;">
                        <label class="checkbox-wrapper">
                                <input type="checkbox" class="custom-checkbox">
                                <span class="checkmark"></span>
                            </label>
                        <svg class="${copiado}" onclick="copiar_dados(this,false)" xmlns="http://www.w3.org/2000/svg" height="15px" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg> 
                        ${borracha}
                    </span>
                </td>
                <td oninput="filterOptions(this,0)"  onblur="enviar_dados(this),hideOptions(event, this)" contenteditable="${content_editable}" onkeydown="teclas_atalho(this,event.key)">
                    ${dados[6]}
                </td>
                <td oninput="filterOptions(this,1)"  onblur="enviar_dados(this),hideOptions(event, this)" contenteditable="${content_editable}"
                    onkeydown="teclas_atalho(this,event.key)">
                    ${dados[8]}
                </td>
                <td oninput="filterOptions(this,2)"  onblur="enviar_dados(this),hideOptions(event, this)" contenteditable="${content_editable}"
                    onkeydown="teclas_atalho(this,event.key)">
                    ${dados[1]}
                </td>
                <td oninput="filterOptions(this,3)" contenteditable="${content_editable}" onblur="enviar_dados(this)">
                    ${dados[4]}
                </td>
                <td oninput="filterOptions(this,9)" contenteditable="${content_editable}" onblur="enviar_dados(this)">
                    ${dados[7]}
                </td>
                <td oninput="filterOptions(this,9)" onfocus="horario_final(this)" contenteditable="${content_editable}" onblur="enviar_dados(this)">
                    ${dados[9]}
                </td>
                <td oninput="filterOptions(this,3)" contenteditable="${content_editable}" onblur="enviar_dados(this)">
                    ${dados[12] || ''}
                </td>
            </tr>`;
    } else if (aba.includes('chamadas')) {
        linha = `<tr name="${dados[0]}">
                    <td style="width: 10px;">
                        <span class="icon-wrapper" style="display: inline-flex; gap: 4px; align-items: center;">`
        if (aba == 'chamadas_pre_prontas') {
            linha += ` <svg class="selecionar" onclick="seleciona_pre_pronta(this)" version="1.0"
                                    xmlns="http://www.w3.org/2000/svg" width="18px" height="18px"
                                    viewBox="0 0 512.000000 512.000000" preserveAspectRatio="xMidYMid meet">
                                    <g transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)"
                                        fill="#000000" stroke="none">
                                        <path
                                            d="M2375 4793 c-921 -80 -1711 -724 -1963 -1603 -68 -235 -87 -373 -86 -635 0 -249 16 -372 78 -598 206 -746 807 -1347 1553 -1553 224 -61 349 -77 598 -78 242 -1 343 11 559 65 621 155 1161 592 1453 1174 90 178 171 439 209 670 27 164 25 505 -4 675 -85 500 -304 918 -659 1261 -369 356 -836 571 -1343 618 -107 10 -303 12 -395 4z m490 -337 c202 -36 347 -83 524 -167 399 -191 708 -500 901 -901 253 -528 253 -1132 -1 -1658 -461 -957 -1602 -1358 -2558 -899 -400 192 -709 501 -901 901 -84 176 -129 318 -167 528 -24 133 -24 467 0 600 38 210 83 352 167 528 122 254 284 463 495 640 291 244 638 394 1025 441 107 14 408 6 515 -13z" />
                                        <path
                                            d="M2829 2734 l-656 -656 -258 324 c-142 178 -261 326 -264 330 -6 7 -243 -175 -248 -190 -2 -4 165 -217 370 -474 l374 -466 784 784 784 784 -110 110 c-60 60 -112 110 -115 110 -3 0 -300 -295 -661 -656z" />
                                    </g>
                                </svg>`;
        } else {
            linha += `<svg class="${copiado}" onclick="copiar_dados(this,false)" xmlns="http://www.w3.org/2000/svg" height="18px"
                                width="18px" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2"
                                stroke-linecap="round" stroke-linejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>

                            <svg class="empenhar" onclick="empenhar_gu(this)" xmlns="http://www.w3.org/2000/svg"
                                xmlns:xlink="http://www.w3.org/1999/xlink" width="20px" height="20px"
                                viewBox="0 0 20 20" version="1.1">
                                <g id="surface1">
                                    <path style=" stroke:none;fill-rule:nonzero;fill-opacity:1;"
                                        d="M 4.765625 1.308594 C 4.167969 1.441406 3.535156 1.882812 3.210938 2.394531 C 3.003906 2.71875 2.96875 2.832031 2.1875 5.4375 L 1.511719 7.691406 L 1.253906 7.839844 C 0.738281 8.136719 0.289062 8.699219 0.105469 9.277344 C 0.0195312 9.550781 0.0195312 9.5625 0.0195312 12.441406 L 0.0195312 15.332031 L 0.109375 15.507812 C 0.15625 15.605469 0.246094 15.75 0.308594 15.824219 C 0.453125 15.996094 0.820312 16.195312 1.0625 16.230469 L 1.242188 16.257812 L 1.257812 17.046875 C 1.269531 17.761719 1.277344 17.847656 1.359375 18.007812 C 1.496094 18.285156 1.652344 18.453125 1.921875 18.597656 L 2.167969 18.730469 L 4.082031 18.730469 L 4.328125 18.597656 C 4.601562 18.449219 4.71875 18.328125 4.875 18.03125 C 4.976562 17.835938 4.980469 17.808594 4.992188 17.039062 L 5.007812 16.25 L 15 16.25 L 15 16.96875 C 15 17.523438 15.015625 17.730469 15.0625 17.882812 C 15.160156 18.179688 15.371094 18.429688 15.664062 18.589844 L 15.917969 18.730469 L 17.832031 18.730469 L 18.078125 18.597656 C 18.351562 18.449219 18.46875 18.328125 18.625 18.03125 C 18.726562 17.835938 18.730469 17.808594 18.742188 17.046875 L 18.757812 16.257812 L 18.9375 16.230469 C 19.167969 16.195312 19.542969 16 19.671875 15.847656 C 19.726562 15.785156 19.816406 15.640625 19.875 15.53125 L 19.980469 15.332031 L 19.980469 12.441406 C 19.980469 9.5625 19.980469 9.550781 19.894531 9.277344 C 19.710938 8.699219 19.261719 8.136719 18.746094 7.839844 L 18.488281 7.691406 L 17.8125 5.4375 C 17.441406 4.199219 17.09375 3.058594 17.039062 2.910156 C 16.785156 2.191406 16.222656 1.640625 15.484375 1.378906 L 15.175781 1.269531 L 10.097656 1.261719 C 5.859375 1.257812 4.976562 1.265625 4.765625 1.308594 Z M 15.257812 5.625 C 15.566406 6.644531 15.816406 7.484375 15.820312 7.488281 C 15.820312 7.496094 13.199219 7.5 9.996094 7.5 C 5.199219 7.5 4.175781 7.492188 4.191406 7.449219 C 4.203125 7.421875 4.453125 6.589844 4.746094 5.601562 C 5.042969 4.617188 5.292969 3.796875 5.300781 3.777344 C 5.308594 3.761719 7.429688 3.753906 10.007812 3.757812 L 14.699219 3.769531 Z M 5.511719 10.738281 C 5.78125 10.867188 5.949219 11.027344 6.097656 11.296875 C 6.21875 11.523438 6.230469 11.570312 6.230469 11.875 C 6.230469 12.179688 6.21875 12.226562 6.097656 12.453125 C 5.949219 12.726562 5.824219 12.84375 5.53125 13 C 5.363281 13.085938 5.28125 13.101562 5 13.101562 C 4.695312 13.105469 4.648438 13.09375 4.421875 12.972656 C 4.152344 12.828125 3.996094 12.660156 3.859375 12.382812 C 3.734375 12.125 3.738281 11.617188 3.867188 11.347656 C 4.03125 11.011719 4.347656 10.753906 4.707031 10.660156 C 4.898438 10.609375 5.324219 10.652344 5.511719 10.738281 Z M 15.511719 10.738281 C 15.78125 10.867188 15.949219 11.027344 16.097656 11.296875 C 16.21875 11.523438 16.230469 11.570312 16.230469 11.875 C 16.230469 12.179688 16.21875 12.226562 16.097656 12.453125 C 15.949219 12.726562 15.824219 12.84375 15.53125 13 C 15.363281 13.085938 15.28125 13.101562 15 13.101562 C 14.695312 13.105469 14.648438 13.09375 14.421875 12.972656 C 14.152344 12.828125 13.996094 12.660156 13.859375 12.382812 C 13.734375 12.125 13.738281 11.617188 13.867188 11.347656 C 14.03125 11.011719 14.347656 10.753906 14.707031 10.660156 C 14.898438 10.609375 15.324219 10.652344 15.511719 10.738281 Z M 15.511719 10.738281 " />
                                </g>
                            </svg>
                            `
        }
        linha += `
                            ${borracha}
                            ${rapido}
                        </span>
                    </td>
                    <td oninput="filterOptions(this,3)" contenteditable="${content_editable}" onblur="enviar_dados(this)">
                        ${dados[1]}
                    </td>
                    <td oninput="filterOptions(this,3)" contenteditable="${content_editable}" onblur="enviar_dados(this)">
                        ${dados[2]}
                    </td>
                    <td oninput="filterOptions(this,3)" contenteditable="${content_editable}" onblur="enviar_dados(this)">
                        ${dados[3]}
                    </td>
                    <td oninput="filterOptions(this,4)" 
                        onblur="enviar_dados(this),hideOptions(event, this)" contenteditable="${content_editable}"
                        onkeydown="teclas_atalho(this,event.key)">
                        ${dados[4]}
                    </td>
                   <td oninput="filterOptions(this,2)" 
                        onblur="enviar_dados(this),hideOptions(event, this)" contenteditable="${content_editable}"
                        onkeydown="teclas_atalho(this,event.key)">
                        ${dados[5]}
                    </td>
                    <td oninput="filterOptions(this,5)" 
                        onblur="enviar_dados(this),hideOptions(event, this)" onfocus="atendente(this)" contenteditable="${content_editable}"
                        onkeydown="teclas_atalho(this,event.key)">
                        ${dados[6]}
                    </td>
                    <td oninput="filterOptions(this,6)" 
                        onblur="enviar_dados(this),hideOptions(event, this)" contenteditable="${content_editable}"
                        onkeydown="teclas_atalho(this,event.key)">
                        ${dados[7]}
                    </td>
                    <td oninput="filterOptions(this,7)" 
                        onblur="enviar_dados(this),hideOptions(event, this)" contenteditable="${content_editable}"
                        onkeydown="teclas_atalho(this,event.key)">
                        ${dados[8]}
                    </td>
                    <td oninput="filterOptions(this,9)" onfocus="horario_final(this)" contenteditable="${content_editable}"
                        onblur="enviar_dados(this)">
                        ${dados[9]}
                    </td>
                </tr>`
    } else if (aba == 'os') {
        linha = `<tr name="${dados[0]}">
                            <td style="width: 10px;">
                                <span class="icon-wrapper" style="display: inline-flex; gap: 4px; align-items: center;">
                                    <label class="checkbox-wrapper">
                                        <input type="checkbox" class="custom-checkbox">
                                        <span class="checkmark"></span>
                                    </label>
                                    <svg class="empenhar" onclick="empenhar_gu(this)" xmlns="http://www.w3.org/2000/svg"
                                        xmlns:xlink="http://www.w3.org/1999/xlink" width="20px" height="20px"
                                        viewBox="0 0 20 20" version="1.1">
                                        <g id="surface1">
                                            <path style=" stroke:none;fill-rule:nonzero;fill-opacity:1;"
                                                d="M 4.765625 1.308594 C 4.167969 1.441406 3.535156 1.882812 3.210938 2.394531 C 3.003906 2.71875 2.96875 2.832031 2.1875 5.4375 L 1.511719 7.691406 L 1.253906 7.839844 C 0.738281 8.136719 0.289062 8.699219 0.105469 9.277344 C 0.0195312 9.550781 0.0195312 9.5625 0.0195312 12.441406 L 0.0195312 15.332031 L 0.109375 15.507812 C 0.15625 15.605469 0.246094 15.75 0.308594 15.824219 C 0.453125 15.996094 0.820312 16.195312 1.0625 16.230469 L 1.242188 16.257812 L 1.257812 17.046875 C 1.269531 17.761719 1.277344 17.847656 1.359375 18.007812 C 1.496094 18.285156 1.652344 18.453125 1.921875 18.597656 L 2.167969 18.730469 L 4.082031 18.730469 L 4.328125 18.597656 C 4.601562 18.449219 4.71875 18.328125 4.875 18.03125 C 4.976562 17.835938 4.980469 17.808594 4.992188 17.039062 L 5.007812 16.25 L 15 16.25 L 15 16.96875 C 15 17.523438 15.015625 17.730469 15.0625 17.882812 C 15.160156 18.179688 15.371094 18.429688 15.664062 18.589844 L 15.917969 18.730469 L 17.832031 18.730469 L 18.078125 18.597656 C 18.351562 18.449219 18.46875 18.328125 18.625 18.03125 C 18.726562 17.835938 18.730469 17.808594 18.742188 17.046875 L 18.757812 16.257812 L 18.9375 16.230469 C 19.167969 16.195312 19.542969 16 19.671875 15.847656 C 19.726562 15.785156 19.816406 15.640625 19.875 15.53125 L 19.980469 15.332031 L 19.980469 12.441406 C 19.980469 9.5625 19.980469 9.550781 19.894531 9.277344 C 19.710938 8.699219 19.261719 8.136719 18.746094 7.839844 L 18.488281 7.691406 L 17.8125 5.4375 C 17.441406 4.199219 17.09375 3.058594 17.039062 2.910156 C 16.785156 2.191406 16.222656 1.640625 15.484375 1.378906 L 15.175781 1.269531 L 10.097656 1.261719 C 5.859375 1.257812 4.976562 1.265625 4.765625 1.308594 Z M 15.257812 5.625 C 15.566406 6.644531 15.816406 7.484375 15.820312 7.488281 C 15.820312 7.496094 13.199219 7.5 9.996094 7.5 C 5.199219 7.5 4.175781 7.492188 4.191406 7.449219 C 4.203125 7.421875 4.453125 6.589844 4.746094 5.601562 C 5.042969 4.617188 5.292969 3.796875 5.300781 3.777344 C 5.308594 3.761719 7.429688 3.753906 10.007812 3.757812 L 14.699219 3.769531 Z M 5.511719 10.738281 C 5.78125 10.867188 5.949219 11.027344 6.097656 11.296875 C 6.21875 11.523438 6.230469 11.570312 6.230469 11.875 C 6.230469 12.179688 6.21875 12.226562 6.097656 12.453125 C 5.949219 12.726562 5.824219 12.84375 5.53125 13 C 5.363281 13.085938 5.28125 13.101562 5 13.101562 C 4.695312 13.105469 4.648438 13.09375 4.421875 12.972656 C 4.152344 12.828125 3.996094 12.660156 3.859375 12.382812 C 3.734375 12.125 3.738281 11.617188 3.867188 11.347656 C 4.03125 11.011719 4.347656 10.753906 4.707031 10.660156 C 4.898438 10.609375 5.324219 10.652344 5.511719 10.738281 Z M 15.511719 10.738281 C 15.78125 10.867188 15.949219 11.027344 16.097656 11.296875 C 16.21875 11.523438 16.230469 11.570312 16.230469 11.875 C 16.230469 12.179688 16.21875 12.226562 16.097656 12.453125 C 15.949219 12.726562 15.824219 12.84375 15.53125 13 C 15.363281 13.085938 15.28125 13.101562 15 13.101562 C 14.695312 13.105469 14.648438 13.09375 14.421875 12.972656 C 14.152344 12.828125 13.996094 12.660156 13.859375 12.382812 C 13.734375 12.125 13.738281 11.617188 13.867188 11.347656 C 14.03125 11.011719 14.347656 10.753906 14.707031 10.660156 C 14.898438 10.609375 15.324219 10.652344 15.511719 10.738281 Z M 15.511719 10.738281 " />
                                        </g>
                                    </svg>
                                    <svg class="borracha" onclick="excluir_linha(this,false)"
                                        xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
                                        width="17px" height="17px" viewBox="0 0 15 15" version="1.1">
                                        <g id="surface1">
                                            <path style=" stroke:none;fill-rule:nonzero;fill-opacity:1;"
                                                d="M 3.28125 12.65625 L 14.0625 12.65625 L 14.0625 13.59375 L 3.28125 13.59375 Z M 3.28125 12.65625 " />
                                            <path style=" stroke:none;fill-rule:nonzero;fill-opacity:1;"
                                                d="M 12.835938 4.925781 L 9.117188 1.214844 C 8.941406 1.039062 8.703125 0.9375 8.453125 0.9375 C 8.207031 0.9375 7.964844 1.039062 7.789062 1.214844 L 1.226562 7.777344 C 1.050781 7.953125 0.953125 8.191406 0.953125 8.441406 C 0.953125 8.6875 1.050781 8.925781 1.226562 9.101562 L 3.34375 11.25 L 7.835938 11.25 L 12.835938 6.253906 C 13.011719 6.078125 13.109375 5.839844 13.109375 5.589844 C 13.109375 5.339844 13.011719 5.101562 12.835938 4.925781 Z M 7.449219 10.3125 L 3.75 10.3125 L 1.875 8.4375 L 4.832031 5.480469 L 8.550781 9.191406 Z M 9.210938 8.550781 L 5.5 4.832031 L 8.4375 1.875 L 12.1875 5.59375 Z M 9.210938 8.550781 " />
                                        </g>
                                    </svg>
                                    <svg class="duplicar" onclick="duplicar(this)" version="1.0" xmlns="http://www.w3.org/2000/svg" width="15px" height="15px" viewBox="0 0 512.000000 512.000000" preserveAspectRatio="xMidYMid meet">
                                        <g transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)"
                                            fill="#000000" stroke="none">
                                            <path d="M1852 4306 c-1179 -590 -1144 -570 -1157 -658 -3 -24 -5 -720 -3 -1548 3 -1490 3 -1505 23 -1540 24 -41 93 -80 142 -80 22 0 198 83 573 270 l540 270 0 -308 c0 -299 1 -309 23 -352 30 -60 76 -90 138 -90 44 0 149 50 1137 544 1179 590 1144 570 1157 658 3 24 5 720 3 1548 -3 1498 -3 1505 -24 1540 -25 43 -87 80 -136 80 -29 0 -159 -61 -578 -270 l-540 -270 0 308 c0 299 -1 309 -22 352 -31 60 -77 90 -139 90 -44 0 -149 -50 -1137 -544z m978 -121 l0 -245 -397 -199 c-219 -109 -406 -207 -415 -218 -49 -55 -48 -20 -48 -1120 l0 -1028 -475 -238 c-261 -130 -477 -237 -480 -237 -3 0 -5 591 -5 1313 l0 1312 902 452 c497 249 906 452 911 452 4 1 7 -109 7 -244z m1280 -1278 l0 -1312 -905 -453 c-498 -248 -907 -452 -910 -452 -3 0 -4 590 -3 1312 l3 1312 905 452 c498 249 906 453 908 453 1 1 2 -590 2 -1312z" />
                                        </g>
                                    </svg>
                                </span>
                            </td>
                            <td oninput="filterOptions(this,3)" contenteditable="true" onblur="enviar_dados(this)">
                                ${dados[1]}
                            </td>
                            <td oninput="filterOptions(this,3)" contenteditable="true" onblur="enviar_dados(this)">
                                ${dados[2]}
                            </td>
                            <td oninput="filterOptions(this,4)" onblur="enviar_dados(this),hideOptions(event, this)"
                                contenteditable="true" onkeydown="teclas_atalho(this,event.key)">
                                ${dados[3]}
                            </td>
                            <td oninput="filterOptions(this,2)" onblur="enviar_dados(this),hideOptions(event, this)"
                                contenteditable="true" onkeydown="teclas_atalho(this,event.key)">
                                ${dados[4]}
                            </td>
                            <td onblur="enviar_dados(this)" contenteditable="true">
                                ${dados[5]}
                            </td>
                            <td oninput="filterOptions(this,0)" contenteditable="true" onblur="enviar_dados(this)" onkeydown="teclas_atalho(this,event.key)">
                                ${dados[6]}
                            </td>
                            <td oninput="filterOptions(this,9)" onfocus="horario_final(this)" contenteditable="true" onblur="enviar_dados(this)">
                                ${dados[7]}
                            </td>
                            <td oninput="filterOptions(this,9)" onfocus="horario_final(this)" contenteditable="true" onblur="enviar_dados(this)">
                                ${dados[8]}
                            </td>
                        </tr>`;
    } else if (aba == 'setores') {
        linha = `<tr name="${dados[0]}">
                    <td style="width: 10px;">
                        <span class="icon-wrapper" style="display: inline-flex; gap: 4px; align-items: center;">
                            ${borracha}
                        </span>
                    </td>
                    <td oninput="filterOptions(this,3)" contenteditable="${content_editable}" onblur="enviar_dados(this)">
                        ${dados[1]}
                    </td>
                    <td oninput="filterOptions(this,3)" contenteditable="${content_editable}" onblur="enviar_dados(this)">
                        ${dados[4]}
                    </td>
                    <td oninput="filterOptions(this,8)" 
                        onblur="enviar_dados(this),hideOptions(event, this)" contenteditable="${content_editable}"
                        onkeydown="teclas_atalho(this,event.key)">
                        ${dados[2]}
                    </td>
                    <td oninput="filterOptions(this,4)" 
                        onblur="enviar_dados(this),hideOptions(event, this)" contenteditable="${content_editable}"
                        onkeydown="teclas_atalho(this,event.key)">
                        ${dados[5]}
                    </td>
                    <td oninput="filterOptions(this,3)" contenteditable="${content_editable}" onblur="enviar_dados(this)">
                        ${dados[3] || ''}
                    </td>
                </tr>`;
    } else if (aba == 'usuários') {
        linha = `<tr>
                    <td style="width: 10px;">
                        <span class="icon-wrapper" style="display: inline-flex; gap: 4px; align-items: center;">
                            ${borracha}
                        </span>
                    </td>
                    <td oninput="filterOptions(this,3)" onblur="enviar_dados(this)" contenteditable="${content_editable}">
                        ${dados[0]}
                    </td>
                    <td oninput="filterOptions(this,3)" onblur="enviar_dados(this)" contenteditable="${content_editable}">
                        ${dados[1]}
                    </td>
                    <td oninput="filterOptions(this,3)" onblur="enviar_dados(this)" contenteditable="${content_editable}">
                        ${dados[2]}
                    </td>
                    <td oninput="filterOptions(this,3)" onblur="enviar_dados(this)" contenteditable="${content_editable}">
                        ${dados[3].substring(0, 4)}
                    </td>
                </tr>`;
    } else if (aba == 'equipes') {
        linha = `<tr name="${dados[0]}">
                    <td>
                        <span class="icon-wrapper" style="display: inline-flex; gap: 4px; align-items: center;">
                                    <label class="checkbox-wrapper">
                                        <input type="checkbox" class="custom-checkbox">
                                        <span class="checkmark"></span>
                                    </label>
                                    <svg class="copiar" onclick="copiar_dados(this,false)"
                                        xmlns="http://www.w3.org/2000/svg" height="15px" viewBox="0 0 24 24" fill="none"
                                        stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                    </svg>
                                </span>
                    </td>
                    <td>
                        ${new Date(parseInt(dados[0])).toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })}
                    </td>
                    <td>
                        ${dados[1]}
                    </td>
                    <td>
                        ${dados[3]}
                    </td>
                    <td>
                        ${dados[4]}
                    </td>
                    <td>
                        ${dados[5]}
                    </td>
                </tr>`;
    }
    return linha;
}

let tdComFoco = {
    linha: '',
    coluna: ''
};

// Quando um <td> ganha foco
document.addEventListener('focusin', (e) => {
    if (e.target.tagName === 'TD') {
        const tr = e.target.closest('tr');
        const td = e.target;

        tdComFoco = {
            linha: tr.getAttribute('name'),
            coluna: Array.from(tr.children).indexOf(td)
        };
    }
});

let ultimaPosicao = 0;
document.addEventListener('focusout', (e) => {
    if (e.target.tagName === 'TD') {
        ultimaPosicao = getCursorPosition(e.target);
    }
});

function getCursorPosition(td) {
    const sel = window.getSelection();
    if (!sel.rangeCount) return 0;

    const range = sel.getRangeAt(0);

    // Se o cursor não está dentro da TD, retorna null
    if (!td.contains(range.startContainer)) return null;

    let pos = range.startOffset;
    let node = range.startContainer;

    // Somar o texto dos nós anteriores dentro da TD
    while (node !== td) {
        while (node.previousSibling) {
            node = node.previousSibling;
            pos += (node.textContent || "").length;
        }
        node = node.parentNode;
    }
    return pos;
}

function setCursorInTd(td, posicao) {
    const range = document.createRange();
    const sel = window.getSelection();

    // Garantir que o TD tenha um nó de texto
    let node = td.firstChild;
    if (!node) {
        node = document.createTextNode("");
        td.appendChild(node);
    }

    // Se a posição for maior que o texto atual, coloca no final
    const comprimento = node.textContent.length;
    const offset = Math.min(posicao, comprimento);

    range.setStart(node, offset);
    range.collapse(true);

    sel.removeAllRanges();
    sel.addRange(range);
}


let unsubscribeRotinasList = [];
let unsubscribeChamadasList = [];
let unsubscribeEquipesList = [];
let unsubscribeOSList = [];

function filtrar_dados(aba) {
    let partes_inicial, data_inicial, partes_final, cad_norte, cad_sul, cad_centro, cad_especializadas, th;

    if (aba == 'rotinas') {
        const select_tipo_periodo = parseInt(document.querySelector('#select_tipo_periodo').value);
        const num_periodo_relativo = parseInt(document.querySelector('#num_periodo_relativo').value);
        let l_rotinas = document.querySelectorAll('#rotinas_table tbody tr');
        for (let index = 0; index < l_rotinas.length - 1; index++) {
            l_rotinas[index].remove();

        }
        if (!document.querySelector('#rotina_data_inicial').getAttribute('readonly')) {
            data_inicial = new Date(document.querySelector('#rotina_data_inicial').value);
            data_inicial.setHours(0, 0, 0, 0);
            data_final = new Date(document.querySelector('#rotina_data_final').value);
            data_final.setHours(0, 0, 0, 0);
        } else {
            data_inicial = new Date();
            data_inicial.setMinutes(data_inicial.getMinutes() - (num_periodo_relativo * select_tipo_periodo));
            data_inicial.setHours(0, 0, 0, 0);
            data_final = new Date();
            data_final.setHours(0, 0, 0, 0);
        }
        cad_norte = document.querySelector('#rotina_checkbox_norte');
        cad_sul = document.querySelector('#rotina_checkbox_sul');
        cad_centro = document.querySelector('#rotina_checkbox_centro');
        cad_especializadas = document.querySelector('#rotina_checkbox_especializadas');
        if (data_inicial == '' || data_final == '' || 0 <= data_final - data_inicial >= 3 || (cad_norte.checked == false && cad_sul.checked == false && cad_centro.checked == false && cad_especializadas.checked == false)) {
            return;
        }
        guardar_filtro('rotinas');


        unsubscribeRotinasList.forEach(unsub => unsub());
        unsubscribeRotinasList = [];
        // lista de unsubscribers

        // Suponha que você já tenha: data_inicial e data_final
        let current = new Date(data_inicial);
        while (current <= data_final) {
            const dataStr = current.toISOString();

            const unsub = db.collection('rotinas').doc(dataStr).onSnapshot(doc => {

                if (!doc.exists) { return };
                const dados = doc.data();
                let linhas = '';
                document.querySelectorAll('#rotinas_table tbody tr').forEach(linha => {
                    let data_linha = new Date(linha.querySelectorAll('td')[5].innerText.split('/')[2]?.split(',')[0], linha.querySelectorAll('td')[5].innerText.split('/')[1] - 1, linha.querySelectorAll('td')[5].innerText.split('/')[0]);
                    if (!isNaN(data_linha.getTime())) {
                        data_linha = data_linha.toISOString();
                    }
                    if (!JSON.stringify(dados).includes(linha.getAttribute('name')) && linha.querySelectorAll('td')[5].innerText !== '' && dataStr == data_linha) {
                        linha.remove();
                    }
                });

                const setores = ['norte', 'sul', 'centro', 'especializadas'];
                setores.forEach(setor => {
                    const checkbox = document.querySelector(`#rotina_checkbox_${setor}`);
                    if (checkbox?.checked && dados[setor]) {
                        dados[setor].split('-++-').forEach(linha => {
                            if (!linha) return;
                            const celulas = linha.split('-()-');
                            let datahorafinal_filtro, data_inicial_filtro, datahora_linha;
                            const partes_datahora = celulas[7].split(/\/|, |:/);
                            datahora_linha = new Date(parseInt(partes_datahora[2]), parseInt(partes_datahora[1]) - 1, parseInt(partes_datahora[0]), parseInt(partes_datahora[3]), parseInt(partes_datahora[4]));
                            if (!document.querySelector('#rotina_data_inicial').getAttribute('readonly')) {
                                data_inicial_filtro = new Date(document.querySelector('#rotina_data_inicial').value);
                                datahorafinal_filtro = new Date(document.querySelector('#rotina_data_final').value);
                            } else {
                                datahorafinal_filtro = new Date();
                                data_inicial_filtro = new Date();
                                data_inicial_filtro.setMinutes(data_inicial_filtro.getMinutes() - (num_periodo_relativo * select_tipo_periodo));
                            }
                            if (data_inicial_filtro <= datahora_linha && datahora_linha <= datahorafinal_filtro) {
                                const l = criar_linha('rotinas', celulas);
                                if (document.querySelector(`#rotinas_table tr[name='${celulas[0]}']`)) {
                                    let marcado = document.querySelector(`#rotinas_table tr[name='${celulas[0]}'] input[type=checkbox]`).checked;
                                    document.querySelector(`#rotinas_table tr[name='${celulas[0]}']`).outerHTML = l;
                                    document.querySelector(`#rotinas_table tr[name='${celulas[0]}'] input[type=checkbox]`).checked = marcado == true;
                                } else {
                                    linhas += l;
                                }
                            }
                        });
                    }
                });

                document.querySelector('#rotinas_table tbody').insertAdjacentHTML('afterbegin', linhas);
                th = document.querySelector('#rotinas_table th[asc],#rotinas_table th[desc]');
                if (th) {
                    const index = Array.from(th.closest('thead').querySelectorAll('th')).indexOf(th);
                    let lin_tab = Array.from(th.closest('table').querySelectorAll('tbody tr')).map((l) => l.querySelectorAll('td')[index].innerText + '-&&-' + l.outerHTML + '-&&-' + l.querySelector('input[type=checkbox]').checked);
                    lin_tab.pop();
                    if (th.getAttribute('asc')) {
                        lin_tab.sort().reverse();
                    } else {
                        lin_tab.sort();
                    }
                    th.closest('table').querySelector('tbody').innerHTML = th.closest('table').querySelector('tbody tr:last-child').outerHTML;
                    lin_tab.forEach(l => {
                        th.closest('table').querySelector('tbody tr:last-child').insertAdjacentHTML('beforebegin', l.split('-&&-')[1]);
                        th.closest('table').querySelector('tbody tr:last-child').previousElementSibling.querySelector('input[type=checkbox]').checked = l.split('-&&-')[2] == 'true';
                    });
                    if (tdComFoco && document.querySelectorAll(`tr[name="${tdComFoco['linha']}"] td`)[tdComFoco['coluna']]) {
                        document.querySelectorAll(`tr[name="${tdComFoco['linha']}"] td`)[tdComFoco['coluna']].focus();
                        setCursorInTd(document.querySelectorAll(`tr[name="${tdComFoco['linha']}"] td`)[tdComFoco['coluna']], ultimaPosicao);
                    }
                    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
                }
            });

            unsubscribeRotinasList.push(unsub); // salvar função para limpar depois
            current.setDate(current.getDate() + 1);
        }


    } else if (aba == 'chamadas') {
        let registros = [];
        let l_chamadas = document.querySelectorAll('#chamadas_table tbody tr');
        for (let index = 0; index < l_chamadas.length - 1; index++) {
            l_chamadas[index].remove();

        }
        data_inicial = new Date(document.querySelector('#chamadas_data_inicial').value);
        data_inicial.setHours(0, 0, 0, 0);
        data_final = new Date(document.querySelector('#chamadas_data_final').value);
        data_final.setHours(0, 0, 0, 0);
        if (data_inicial == '' || data_final == '' || 0 <= data_final - data_inicial >= 3) {
            return;
        }
        guardar_filtro('chamadas');


        unsubscribeChamadasList.forEach(unsub => unsub());
        unsubscribeChamadasList = [];
        // lista de unsubscribers

        // Suponha que você já tenha: data_inicial e data_final
        let current = new Date(data_inicial);

        while (current <= data_final) {
            const dataStr = current.toISOString();

            const unsub = db.collection('chamadas').doc(dataStr).onSnapshot(doc => {
                if (!doc.exists) { return };
                const dados = doc.data();

                let linhas = '';
                document.querySelectorAll('#chamadas_table tbody tr').forEach(linha => {
                    let data_linha = new Date(linha.querySelectorAll('td')[9].innerText.split('/')[2]?.split(',')[0], linha.querySelectorAll('td')[9].innerText.split('/')[1] - 1, linha.querySelectorAll('td')[9].innerText.split('/')[0]);
                    if (!isNaN(data_linha.getTime())) {
                        data_linha = data_linha.toISOString();
                    }
                    if (!JSON.stringify(dados).includes(linha.getAttribute('name')) && linha.querySelectorAll('td')[9].innerText !== '' && dataStr == data_linha) {
                        linha.remove();
                    }
                });

                dados.chamadas.split('-++-').forEach(linha => {
                    if (!linha) return;
                    const celulas = linha.split('-()-'); //9

                    const partes_datahora = celulas[9].split(/\/|, |:/);
                    const datahora_linha = new Date(parseInt(partes_datahora[2]), parseInt(partes_datahora[1]) - 1, parseInt(partes_datahora[0]), parseInt(partes_datahora[3]), parseInt(partes_datahora[4]));
                    if (new Date(document.querySelector('#chamadas_data_inicial').value) <= datahora_linha && datahora_linha <= new Date(document.querySelector('#chamadas_data_final').value)) {
                        const l = criar_linha('chamadas', celulas);
                        if (document.querySelector(`#chamadas_table tr[name='${celulas[0]}']`)) {
                            document.querySelector(`#chamadas_table tr[name='${celulas[0]}']`).outerHTML = l;
                        } else {
                            linhas += l;
                        }
                    }
                });


                document.querySelector('#chamadas_table tbody').insertAdjacentHTML('afterbegin', linhas);
                const rg = Array.from(document.querySelectorAll('#chamadas_table tbody tr')).map(r => r.getAttribute('name')).filter(r => !r.includes(JSON.parse(sessionStorage.getItem('usuario_logado')).nome));
                if (registros.length == 0) {
                    registros.push(...rg);
                } else {
                    const novosRg = rg.filter(r => !registros.includes(r));
                    if (novosRg.length > 0) {
                        const dados = document.querySelectorAll(`#chamadas [name="${novosRg[0]}"] td`)
                        const mensagem = `Nova chamada: ${dados[4].innerText} - ${dados[5].innerText}`;
                        notificar(mensagem);
                        registros.push(...novosRg);
                    }
                }

                window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
                th = document.querySelector('#chamadas_table th[asc],#chamadas_table th[desc]');
                if (th) {
                    const index = Array.from(th.closest('thead').querySelectorAll('th')).indexOf(th);
                    let lin_tab = Array.from(th.closest('table').querySelectorAll('tbody tr')).map((l) => l.querySelectorAll('td')[index].innerText + '-&&-' + l.outerHTML);
                    lin_tab.pop();
                    if (th.getAttribute('asc')) {
                        lin_tab.sort().reverse();
                    } else {
                        lin_tab.sort();
                    }
                    th.closest('table').querySelector('tbody').innerHTML = th.closest('table').querySelector('tbody tr:last-child').outerHTML;
                    lin_tab = lin_tab.map((l) => l.split('-&&-')[1]).forEach(l => {
                        th.closest('table').querySelector('tbody tr:last-child').insertAdjacentHTML('beforebegin', l);
                    });
                    if (tdComFoco && document.querySelectorAll(`tr[name="${tdComFoco['linha']}"] td`)[tdComFoco['coluna']]) {
                        document.querySelectorAll(`tr[name="${tdComFoco['linha']}"] td`)[tdComFoco['coluna']].focus();
                    }
                    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
                }
                const resumo_chamadas = document.querySelectorAll('#resumo_chamadas tbody td');
                let denuncias_153 = 0;
                let denuncias_wats = 0;
                let total_ligacoes = 0;
                let apoio_ao_samu = 0;

                document.querySelectorAll('#chamadas_table tbody tr').forEach(tr => {
                    let celulas = tr.querySelectorAll('td');
                    if ((celulas[8].innerText.includes('153') || celulas[8].innerText.includes('156')) && !celulas[8].innerText.includes('WhatsApp')) {
                        denuncias_153++;
                        total_ligacoes++;
                    }
                    if (celulas[8].innerText.includes('WhatsApp 153')) {
                        denuncias_wats++;
                    }
                    if (celulas[8].innerText.includes('5161')) {
                        total_ligacoes++;
                    }
                    if (celulas[4].innerText.toLowerCase().includes('samu')) {
                        apoio_ao_samu++;
                    }
                    resumo_chamadas[0].innerText = denuncias_153;
                    resumo_chamadas[1].innerText = denuncias_wats;
                    resumo_chamadas[2].innerText = total_ligacoes;
                    resumo_chamadas[3].innerText = apoio_ao_samu;

                })

            });

            unsubscribeChamadasList.push(unsub); // salvar função para limpar depois
            current.setDate(current.getDate() + 1);
        }
    } else if (aba == 'os') {
        let l_os = document.querySelectorAll('#os_table tbody tr');
        for (let index = 0; index < l_os.length - 1; index++) {
            l_os[index].remove();

        }
        data_inicial = new Date(document.querySelector('#os_data_inicial').value);
        data_inicial.setHours(0, 0, 0, 0);
        data_final = new Date(document.querySelector('#os_data_final').value);
        data_final.setHours(0, 0, 0, 0);
        if (data_inicial == '' || data_final == '' || 0 <= data_final - data_inicial >= 3) {
            return;
        }
        guardar_filtro('os');

        unsubscribeOSList.forEach(unsub => unsub());
        unsubscribeOSList = [];
        // lista de unsubscribers

        // Suponha que você já tenha: data_inicial e data_final
        let current = new Date(data_inicial);

        while (current <= data_final) {
            const dataStr = current.toISOString();

            const unsub = db.collection('os').doc(dataStr).onSnapshot(doc => {
                if (!doc.exists) { return };
                const dados = doc.data();

                let linhas = '';
                document.querySelectorAll('#os_table tbody tr').forEach(linha => {
                    let data_linha = new Date(linha.querySelectorAll('td')[6].innerText.split('/')[2]?.split(',')[0], linha.querySelectorAll('td')[6].innerText.split('/')[1] - 1, linha.querySelectorAll('td')[6].innerText.split('/')[0]);
                    if (!isNaN(data_linha.getTime())) {
                        data_linha = data_linha.toISOString();
                    }
                    if (!JSON.stringify(dados).includes(linha.getAttribute('name')) && linha.querySelectorAll('td')[6].innerText !== '' && dataStr == data_linha) {
                        linha.remove();
                    }
                });

                dados.os.split('-++-').forEach(linha => {
                    if (!linha) return;
                    const celulas = linha.split('-()-'); //6

                    const partes_datahora = celulas[7].split(/\/|, |:/);
                    const datahora_linha = new Date(parseInt(partes_datahora[2]), parseInt(partes_datahora[1]) - 1, parseInt(partes_datahora[0]), parseInt(partes_datahora[3]), parseInt(partes_datahora[4]));
                    if (new Date(document.querySelector('#os_data_inicial').value) <= datahora_linha && datahora_linha <= new Date(document.querySelector('#os_data_final').value)) {
                        const l = criar_linha('os', celulas);
                        if (document.querySelector(`#os_table tr[name='${celulas[0]}']`)) {
                            document.querySelector(`#os_table tr[name='${celulas[0]}']`).outerHTML = l;
                        } else {
                            linhas += l;
                        }
                    }
                });



                document.querySelector('#os_table tbody').insertAdjacentHTML('afterbegin', linhas);
                filtro_os();
                window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
                th = document.querySelector('#os_table th[asc],#os_table th[desc]');
                if (th) {
                    const index = Array.from(th.closest('thead').querySelectorAll('th')).indexOf(th);
                    let lin_tab = Array.from(th.closest('table').querySelectorAll('tbody tr')).map((l) => l.querySelectorAll('td')[index].innerText + '-&&-' + l.outerHTML);
                    lin_tab.pop();
                    if (th.getAttribute('asc')) {
                        lin_tab.sort().reverse();
                    } else {
                        lin_tab.sort();
                    }
                    th.closest('table').querySelector('tbody').innerHTML = th.closest('table').querySelector('tbody tr:last-child').outerHTML;
                    lin_tab = lin_tab.map((l) => l.split('-&&-')[1]).forEach(l => {
                        th.closest('table').querySelector('tbody tr:last-child').insertAdjacentHTML('beforebegin', l);
                    });
                    if (tdComFoco && document.querySelectorAll(`tr[name="${tdComFoco['linha']}"] td`)[tdComFoco['coluna']]) {
                        document.querySelectorAll(`tr[name="${tdComFoco['linha']}"] td`)[tdComFoco['coluna']].focus();
                    }
                    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
                }

            });

            unsubscribeOSList.push(unsub); // salvar função para limpar depois
            current.setDate(current.getDate() + 1);
        }
    } else if (aba == 'setores') {
        const filtros = Array.from(document.querySelectorAll('#filtro_setores input'));
        const linhas = document.querySelectorAll('#setores_table tbody tr');

        function filtrarTabela() {
            linhas.forEach(linha => {
                const colunas = linha.querySelectorAll('td');

                if (linha.innerText.trim() === '') {
                    linha.style.display = '';
                    return;
                }

                const corresponde = filtros.every((filtro, i) => {
                    const textoFiltro = filtro.value.trim().toLowerCase();
                    const textoCelula = colunas[i + 1]?.innerText.trim().toLowerCase() || '';
                    return textoCelula.includes(textoFiltro);
                });

                linha.style.display = corresponde ? '' : 'none';
            });
        }

        const filtrarComDelay = debounce(filtrarTabela, 200);

        // Adiciona evento nos inputs com debounce
        filtros.forEach(input => {
            input.addEventListener('input', filtrarComDelay);
        });
    } else if (aba == 'equipes') {
        let l_equipes = document.querySelectorAll('#equipes_table tbody tr');
        for (let index = 0; index < l_equipes.length; index++) {
            l_equipes[index].remove();

        }
        data_inicial = new Date(document.querySelector('#equipes_data_inicial').value);
        data_inicial.setHours(0, 0, 0, 0);
        data_final = new Date(document.querySelector('#equipes_data_final').value);
        data_final.setHours(0, 0, 0, 0);
        if (data_inicial == '' || data_final == '' || 0 <= data_final - data_inicial >= 3) {
            return;
        }
        guardar_filtro('equipes');


        unsubscribeEquipesList.forEach(unsub => unsub());
        unsubscribeEquipesList = [];
        // lista de unsubscribers

        // Suponha que você já tenha: data_inicial e data_final
        let current = new Date(data_inicial);

        while (current <= data_final) {
            const dataStr = current.toISOString();

            const unsub = db.collection('equipes').doc(dataStr).onSnapshot(doc => {
                if (!doc.exists) { return };
                document.querySelector('#equipes_table tbody').innerHTML = '';
                const dados = Object.entries(doc.data());

                let linhas = '';

                for (const [campoId, linha] of dados) {
                    if (!linha) return;
                    let celulas = linha.split('-()-');

                    const datahora_linha = new Date(parseInt(campoId));
                    celulas.unshift(campoId);

                    if (new Date(document.querySelector('#equipes_data_inicial').value) <= datahora_linha && datahora_linha <= new Date(document.querySelector('#equipes_data_final').value)) {
                        if (celulas[3].includes('-++-')) {
                            const pessoas = celulas[3].split(',');
                            pessoas.forEach((pessoa) => {
                                const gms = JSON.parse(localStorage.getItem('gms')).gms.split('-');

                                let l = [celulas[0], celulas[1], 'Agente', gms.find(item => item.toUpperCase().startsWith(pessoa.split('-++-')[0].toUpperCase())), pessoa.split('-++-')[1], celulas[2]];
                                l = criar_linha('equipes', l);
                                linhas += l;
                            })
                        } else {
                            const equipamentos = celulas[3].split(',');
                            equipamentos.forEach((equipamentos) => {
                                let l = [celulas[0], celulas[1], 'Equipamento', equipamentos.split(' - ')[1], equipamentos.split(' - ')[0], celulas[2]];
                                l = criar_linha('equipes', l);
                                linhas += l;
                            })
                        }
                    }
                }
                document.querySelector('#equipes_table tbody').insertAdjacentHTML('afterbegin', linhas);
                document.querySelectorAll('#filtro_equipes input[type="checkbox"]:not([value="Todas"])').forEach(input => {
                    input.checked = input.checked == true;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                })

                window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
                th = document.querySelector('#equipes_table th[asc],#equipes_table th[desc]');
                if (th) {
                    const index = Array.from(th.closest('thead').querySelectorAll('th')).indexOf(th);
                    let lin_tab = Array.from(th.closest('table').querySelectorAll('tbody tr')).map((l) => l.querySelectorAll('td')[index].innerText + '-&&-' + l.outerHTML);
                    if (th.getAttribute('asc')) {
                        lin_tab.sort().reverse();
                    } else {
                        lin_tab.sort();
                    }
                    th.closest('table').querySelector('tbody').innerHTML = '';
                    lin_tab = lin_tab.map((l) => l.split('-&&-')[1]).forEach(l => {
                        th.closest('table').querySelector('tbody').insertAdjacentHTML('afterbegin', l);
                    });
                    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
                }

            });

            unsubscribeEquipesList.push(unsub); // salvar função para limpar depois
            current.setDate(current.getDate() + 1);
        }
    }

    return true;
}

function debounce(func, delay) {
    let timeout;
    return function () {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, arguments), delay);
    };
}

const optionsList = document.querySelector('#options-list');

function showOptions(td, list) {
    const rect = td.getBoundingClientRect();
    const itemHeight = 40;
    const buffer = 10;
    const maxHeight = 400;

    const totalItems = optionsList.querySelectorAll('li').length;
    const totalHeight = totalItems * itemHeight;
    const menuHeight = Math.min(totalHeight, maxHeight);

    let top;
    // Verifica se há espaço suficiente abaixo da célula
    const enoughSpaceBelow = rect.bottom + menuHeight + buffer <= window.innerHeight;

    if (enoughSpaceBelow) {
        // Mostrar abaixo da célula
        top = rect.bottom + window.scrollY + buffer;
    } else {
        // Mostrar acima, mas colado na célula (não depende da altura do menu)
        // Só subtrai o menuHeight agora (corrige o comportamento anterior)
        top = rect.top + window.scrollY - menuHeight - buffer;

        // Garante que não ultrapasse o topo da tela (ajuste opcional)
        const minTop = 10 + window.scrollY;
        if (top < minTop) {
            const ajuste = rect.top + window.scrollY - minTop - buffer;
            const alturaAjustada = Math.min(menuHeight, ajuste);
            top = minTop;
            optionsList.style.maxHeight = `${alturaAjustada}px`;
        } else {
            optionsList.style.maxHeight = `${menuHeight}px`;
        }
    }

    // Aplica estilos
    optionsList.style.top = `${top}px`;
    optionsList.style.left = `${rect.left + window.scrollX}px`;
    optionsList.style.width = `${rect.width}px`;
    optionsList.style.display = "block";
    optionsList.dataset.targetId = td.dataset.id;
    optionsList.targetTd = td;

}


function hideOptions(event, td) {
    const aba = document.querySelector('button[class="tab-button ativo"]').innerText.toLowerCase();
    let options = optionsList.innerHTML;
    setTimeout(() => { // delay para permitir clique
        if (optionsList.innerHTML == options) {
            optionsList.style.display = "none";
        }
    }, 200);
    let celulas = td.parentNode.querySelectorAll('td');
    let celulas_vazias = 'sim';
    celulas.forEach(l => {
        if (l.innerText != '' && l.innerHTML != '<br>') {
            celulas_vazias = 'nao';
        }
    })

    if (celulas_vazias == 'sim' && td.parentNode.parentNode.querySelectorAll('tr').length > 1 && td.parentNode != td.parentNode.parentNode.querySelectorAll('tr')[td.parentNode.parentNode.querySelectorAll('tr').length - 1]) {
        td.parentNode.remove();
    }
    if (td == td.parentNode.querySelectorAll('td')[3] && optionsList.style.display == "none" && aba == 'rotinas') {
        td.parentNode.nextElementSibling?.querySelectorAll('td')[1]?.focus();
    }
}

function filterOptions(td, list) {
    let aba;
    if (document.getElementById('modal_msg_rapida').style.display == 'none' || document.getElementById('modal_msg_rapida').style.display == '') {
        aba = document.querySelector('button[class="tab-button ativo"]').innerText.toLowerCase();
    } else {
        aba = 'chamadas_pre_prontas';
    }
    let celulas = td.parentNode.querySelectorAll('td');

    let vazia = '';
    const table = document.querySelector(`#${aba}_table tbody`);
    table.querySelectorAll('tr')[table.querySelectorAll('tr').length - 1].querySelectorAll('td').forEach(function (item) {
        if (item.innerText != '') {
            vazia = 'nao';
        }
    });

    celulas.forEach(function (cel) {
        if (cel.innerText != '' && vazia == 'nao') {
            if (aba != 'usuários') {
                table.insertAdjacentHTML('beforeend', criar_linha(aba, [JSON.parse(sessionStorage.getItem('usuario_logado')).nome + '-**-' + new Date().getTime(), '', '', '', '', '', '', '', '', '', '', '']));
            } else {
                table.insertAdjacentHTML('beforeend', criar_linha(aba, ['', '', '', '', '']));
            }
            td.focus();
            vazia = '';
        }

    });
    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth"
    });

    const text = td.innerText.trim().toLowerCase();

    if (td == td.parentNode.querySelectorAll('td')[4] && aba == 'Rotinas') {
        let dados = td.parentNode.querySelectorAll('td')[0].getAttribute('dados').split('-()-');
        dados[3] = td.innerText.trim();
        td.parentNode.querySelectorAll('td')[0].setAttribute('dados', dados.join('-()-'));
    }
    if (list == 9 && text.length == 4 && (/^\d+$/.test(text) || (text.replace(':', '').length == 4 && /^\d+$/.test(text.replace(':', ''))))) {
        td.innerText = new Date().toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }) + ', ' + text.replace(':', '').substring(0, 2) + ':' + text.replace(':', '').substring(2, 4);

        const range = document.createRange();
        const sel = window.getSelection();

        range.selectNodeContents(td);
        range.collapse(false); // false = final do conteúdo

        sel.removeAllRanges();
        sel.addRange(range);
    }
    updateOptions(td, text, list);
    showOptions(td, list);

}

function updateOptions(td, filter, list) {
    let options = [];
    if (list == 0) {
        JSON.parse(localStorage.getItem('gus')).gus.split('-').forEach(function (item) {
            options.push(item + ' - Dia');
            options.push(item + ' - Noite');
        });
    } else if (list == 1) {
        options = JSON.parse(localStorage.getItem('qru')).qru.split('-').sort();
    } else if (list == 2) {
        JSON.parse(localStorage.getItem('qth')).qth.split('-++-').forEach(function (item) {
            if (item != '' && item.split('-()-')[1].replaceAll('"', '').trim() != '') {
                options.push(item.split('-()-')[1].replaceAll('"', '').trim());
                if (item.split('-()-')[1].replaceAll('"', '').trim().toLowerCase() == filter && (document.querySelector('button[class="tab-button ativo"]').innerText == 'Rotinas' || document.querySelector('button[class="tab-button ativo"]').innerText == 'OS')) {
                    td.nextElementSibling.innerText = item.split('-()-')[4].replaceAll('"', '').trim();
                    td.parentNode.querySelector('td').setAttribute('dados', item.replace(item.substring(0, item.indexOf('-()-') + 4), '').replaceAll('"', '').trim());
                }
            }
        });
    } else if (list == 4) {
        options = JSON.parse(localStorage.getItem('naturezas')).naturezas.split('-()-').sort();
    } else if (list == 5) {
        options = JSON.parse(localStorage.getItem('gms')).gms.split('-').sort();
    } else if (list == 6) {
        options = JSON.parse(localStorage.getItem('area')).area.split('-').sort();
    } else if (list == 7) {
        options = JSON.parse(localStorage.getItem('meio')).meio.split('-').sort();
    } else if (list == 8) {
        options = JSON.parse(localStorage.getItem('tipo')).tipo.split('-').sort();
    }
    options = options.sort();
    optionsList.innerHTML = "";
    options.filter(opt => opt.toLowerCase().includes(filter)).forEach(opt => {
        const li = document.createElement("li");
        li.textContent = opt;
        li.style.padding = "5px";
        li.style.cursor = "pointer";
        li.onclick = () => {
            optionsList.targetTd.innerText = opt;
            optionsList.targetTd.focus();
            optionsList.targetTd.dispatchEvent(new Event('input', { bubbles: true }));

            optionsList.style.display = "none";
        };
        optionsList.appendChild(li);
    });
    optionsList.querySelector('li')?.classList.add('selecionado');
}

function horario_final(celula) {
    if (celula.innerText == '' || celula.innerText == '\n') {
        celula.innerText = new Date().toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false, // usa o formato 24h
        });
        if (document.querySelector('[class="tab-button ativo"]').innerText != 'OS') {
            celula.closest('tbody').querySelectorAll("tr:last-child td")[1].focus();
        }
    }
}

function atendente(celula) {
    if (celula.innerText == '' || celula.innerText == '\n') {
        celula.innerText = `GCM ${JSON.parse(sessionStorage.getItem('usuario_logado')).nome.toUpperCase()}`;
    }
}


function copiar_dados(celula, todos) {
    const celulas = celula.closest('tr').querySelectorAll('td');
    let texto = '';
    const aba = document.querySelector('button[class="tab-button ativo"]').innerText;
    if (aba == 'Rotinas' && celulas[0].getAttribute('dados')) {
        if (celulas[0].getAttribute('dados').includes('-()-_QRA_-()-_QTR_INICIAL_-()-_QRU_-()-_QTR_FINAL_-()-')) {
            let qth = celulas[0].getAttribute('dados').split('-()-')[0];
            let qth_certo;
            if (qth.startsWith('DEM ')) {
                qth_certo = qth.replace('DEM ', '');
            } else if (qth.startsWith('OS ')) {
                qth_certo = qth.replace('OS ', '');
            } else {
                qth_certo = qth;
            }
            if (!localStorage.getItem('qth').includes(qth_certo.trim()) && !qth.startsWith('OS ')) {
                qth_certo = '';
            }
            texto = `${celulas[0].getAttribute('dados').replace('_QRA_', celulas[1].innerText.trim()).replace('_QTR_INICIAL_', celulas[5].innerText.trim().replace(',', '')).replace('_QRU_', celulas[2].innerText.trim()).replace('_QTR_FINAL_', celulas[6].innerText.trim().replace(',', '')).replace(qth, qth_certo)}`;
        } else {
            texto = `${celulas[0].getAttribute('dados')}-()-${celulas[1].innerText.trim()}-()-${celulas[5].innerText.trim()}-()-${celulas[2].innerText.trim()}-()-${celulas[6].innerText.trim()}-()--()-`;
        }
        if (!texto.includes('-++-')) {
            texto += `-++-`;
        }
    } else if (aba == 'Chamadas') {
        let qth_endereco = celulas[5].innerText;
        if (localStorage.getItem('qth')?.includes(qth_endereco)) {
            let qth = JSON.parse(localStorage.getItem('qth')).qth;
            qth_endereco += ' - ' + qth.substring(qth.indexOf(qth_endereco), qth.indexOf('-++-', qth.indexOf(qth_endereco))).split('-()-')[3];
        }
        let samu = '';
        if (celulas[4].innerText.toLowerCase().includes('samu')) {
            samu = '*Definir ponto de encontro e aguardar liberação para deslocamento.*'
        }
        texto = `*Demanda via ${celulas[8].innerText}*
                
*🚨ATIVAR AS CÂMERAS CORPORAIS🚨*
                    
*Data-hora:* ${celulas[9].innerText}
                    
*Natureza:* ${celulas[4].innerText}
                    
*Situação:* ${celulas[3].innerText} 
                    
*Endereço:*
${qth_endereco}
                    
*Contato denunciante:*
*Nome:* ${celulas[1].innerText}
*Número:* ${celulas[2].innerText}
                    
${samu}`
    } else if (aba == 'Equipes') {
        texto = `${celulas[2].innerText.trim()}-()-${celulas[3].innerText.trim()}-()-${celulas[4].innerText.trim()}-&&-`;
    }
    if (todos == true) {
        return texto;
    } else {
        navigator.clipboard.writeText(texto.replaceAll(`
                    `, '\n'));
        const msg = document.createElement('div');
        msg.className = 'copiado-msg';
        msg.innerText = 'Copiado!';

        // Garante que o SVG possa conter o elemento
        const wrapper = celula.parentElement;
        wrapper.style.position = 'relative';
        wrapper.appendChild(msg);

        setTimeout(() => msg.remove(), 1000);
    }


    celula.setAttribute('class', 'copiar_clicado');
    let copiados = localStorage.getItem('copiados') || '';
    copiados += celula.closest('tr').getAttribute('name')
    localStorage.setItem('copiados', copiados);
}

function teclas_atalho(celula, tecla) {
    let options = document.querySelectorAll('#options-list li');
    if (document.querySelector('ul').style.display == "block") {
        let selecionado = document.querySelector('li.selecionado');
        if (tecla == "ArrowDown" && options.length > 1 && Array.from(options).indexOf(document.querySelector('li.selecionado')) < options.length - 1) {
            selecionado.classList.remove('selecionado');
            selecionado.nextElementSibling?.classList.add('selecionado');
            selecionado.nextElementSibling?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        if (tecla == "ArrowUp" && options.length > 1 && Array.from(options).indexOf(document.querySelector('li.selecionado')) > 0) {
            selecionado.classList.remove('selecionado');
            selecionado.previousElementSibling?.classList.add('selecionado');
            selecionado.previousElementSibling?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        if (tecla == 'Tab' || tecla == 'Enter') {
            event.preventDefault();
            if (celula == 'senha') {
                document.querySelector('#login button').click();
            } else {
                selecionado?.click();
                celula.nextElementSibling?.click();
                celula.nextElementSibling?.focus();
            }
        }
        if (tecla == 'Escape') {
            event.preventDefault();
            document.querySelector('ul').style.display = "none";
        }
    }
    if (tecla == 'Enter' && celula == 'senha') {
        event.preventDefault();
        document.querySelector('#login button').click();
    }
    if (tecla == 'Enter' && celula == 'primeiro_acesso') {
        event.preventDefault();
        document.querySelector('#primeiro_acesso button').click();
    }

}

function selecionarAba(botao) {
    document.querySelector('#rotinas').style.display = 'none';
    document.querySelector('#chamadas').style.display = 'none';
    document.querySelector('#os').style.display = 'none';
    document.querySelector('#setores').style.display = 'none';
    document.querySelector('#equipes').style.display = 'none';
    document.querySelector('#usuários').style.display = 'none';

    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('ativo');
    });
    botao.classList.add('ativo');
    if (botao.innerText == 'Rotinas') {
        document.querySelector('#rotinas').style.display = 'block';
    } else if (botao.innerText == 'Chamadas') {
        document.querySelector('#chamadas').style.display = 'block';
    } else if (botao.innerText == 'OS') {
        document.querySelector('#os').style.display = 'block';
    } else if (botao.innerText == 'Setores') {
        document.querySelector('#setores').style.display = 'block';
    } else if (botao.innerText == 'Usuários') {
        document.querySelector('#usuários').style.display = 'block';
    } else if (botao.innerText == 'Equipes') {
        document.querySelector('#equipes').style.display = 'block';
    }
    localStorage.setItem('config_abas', botao.innerText);

}

function enviar_dados(td) {
    const aba = document.querySelector('button[class="tab-button ativo"]').innerText;
    let celulas = td.parentNode.querySelectorAll('td');
    let hora = new Date().toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false, // usa o formato 24h
    });
    if (document.querySelector('button[class="tab-button ativo"]').innerText == 'Rotinas' &&
        celulas[1].innerText != '' &&
        celulas[2].innerText != '' &&
        celulas[5].innerText == '' &&
        (celulas[3].innerText != '' || celulas[4].innerText != '')
    ) {
        // Preenche a célula 5 com a hora atual
        const hora = new Date().toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false, // usa o formato 24h
        });
        celulas[5].innerText = hora;
    }

    if (aba == 'Rotinas' && (celulas[1].innerText == '' || celulas[2].innerText == '')) {
        return;
    } else if (aba == 'Chamadas' && document.getElementById('modal_msg_rapida').style.display != 'block' && (celulas[1].innerText == '' || celulas[3].innerText == '' || celulas[4].innerText == '' || celulas[5].innerText == '' || celulas[6].innerText == '' || celulas[7].innerText == '' || celulas[8].innerText == '' || celulas[9].innerText == '')) {
        return;
    } else if (aba == 'OS' && (celulas[1].innerText == '' || celulas[2].innerText == '' || celulas[3].innerText == '' || celulas[5].innerText == '' || celulas[6].innerText == '' || celulas[7].innerText == '')) {
        return;
    } else if (aba == 'Setores' && (celulas[1].innerText == '' || celulas[2].innerText == '' || celulas[3].innerText == '' || celulas[4].innerText == '')) {
        return;
    } else if (aba == 'Usuários' && (celulas[1].innerText == '' || celulas[2].innerText == '' || celulas[3].innerText == '')) {
        return;
    }
    let data = '';
    let newData = '';
    let interval_envio = setInterval(() => {
        if (document.getElementById('modal_msg_rapida').style.display == 'block' || (aba == 'Setores' && celulas[1].innerText != '' && celulas[2].innerText != '' && celulas[3].innerText != '' && celulas[4].innerText != '') || aba == 'Usuários' || (celulas[1].innerText != '' && celulas[2].innerText != '' && (celulas[3].innerText != '' || celulas[4].innerText != '') && celulas[5].innerText != '')) {
            clearInterval(interval_envio);
            const cads_gu = ['6734', '2958', 'C', 'PAR'];
            const cads_tipo = ['norte', 'sul', 'centro', 'especializadas'];
            let cad = '';
            for (let index = 0; index < cads_gu.length; index++) {
                if (cads_gu[index].includes(celulas[1].innerText.substring(0, 1))) {
                    cad = cads_tipo[index];
                }
            }
            if (aba == 'Rotinas') {
                data = new Date(celulas[5].innerText.split(',')[0].split('/')[2], parseInt(celulas[5].innerText.split('/')[1]) - 1, celulas[5].innerText.split('/')[0]);

                if (celulas[0].getAttribute('dados')?.includes('-()--()--()--()--()-_QRA_-()-_QTR_INICIAL_-()-_QRU_-()-_QTR_FINAL_-()--()-')) {
                    newData = `${celulas[0].parentNode.getAttribute('name')}-()-${celulas[3].innerText.trim() + '-()--()--()-' + celulas[4].innerText.trim() + '-()-'}-()-${celulas[1].innerText.trim()}-()-${celulas[5].innerText.trim()}-()-${celulas[2].innerText.trim()}-()-${celulas[6].innerText.trim()}-()--()--()-${celulas[7].innerText.trim()}-++-`;
                } else if (celulas[0].getAttribute('dados')?.includes('-()-_QRA_-()-_QTR_INICIAL_-()-_QRU_-()-_QTR_FINAL_-()-')) {
                    newData = celulas[0].parentNode.getAttribute('name') + '-()-' + celulas[0].getAttribute('dados').replace('_QRA_', celulas[1].innerText.trim()).replace('_QTR_INICIAL_', celulas[5].innerText.trim()).replace('_QRU_', celulas[2].innerText.trim()).replace('_QTR_FINAL_', celulas[6].innerText.trim()) + '-()-' + celulas[7].innerText.trim() + '-++-';
                } else {
                    newData = `${celulas[0].parentNode.getAttribute('name')}-()-${celulas[0].getAttribute('dados') || (celulas[3].innerText.trim() + '-()--()--()-' + celulas[4].innerText.trim() + '-()-')}-()-${celulas[1].innerText.trim()}-()-${celulas[5].innerText.trim()}-()-${celulas[2].innerText.trim()}-()-${celulas[6].innerText.trim()}-()--()--()-${celulas[7].innerText.trim()}-++-`;
                }
            } else if (aba == 'Chamadas') {
                data = celulas[9].innerText.split(',')[0].split('/').map((d) => parseInt(d));
                data = new Date(data[2], data[1] - 1, data[0]);

                newData = `${td.parentNode.getAttribute('name')}-()-${celulas[1].innerText.trim()}-()-${celulas[2].innerText.trim()}-()-${celulas[3].innerText.trim()}-()-${celulas[4].innerText.trim()}-()-${celulas[5].innerText.trim() || ''}-()-${celulas[6].innerText.trim() || ''}-()-${celulas[7].innerText.trim() || ''}-()-${celulas[8].innerText.trim() || ''}-()-${celulas[9].innerText.trim()}-++-`;
            } else if (aba == 'OS') {
                data = celulas[7].innerText.split(',')[0].split('/').map((d) => parseInt(d));
                data = new Date(data[2], data[1] - 1, data[0]);

                newData = `${td.parentNode.getAttribute('name')}-()-${celulas[1].innerText.trim()}-()-${celulas[2].innerText.trim()}-()-${celulas[3].innerText.trim()}-()-${celulas[4].innerText.trim()}-()-${celulas[5].innerText.trim() || ''}-()-${celulas[6].innerText.trim() || ''}-()-${celulas[7].innerText.trim() || ''}-()-${celulas[8].innerText.trim() || ''}-++-`;
            } else if (aba == 'Setores') {
                data = new Date(new Date(parseInt(td.parentNode.getAttribute('name'))).getFullYear(), new Date(parseInt(td.parentNode.getAttribute('name'))).getMonth(), new Date(parseInt(td.parentNode.getAttribute('name'))).getDate());
                newData = `${td.parentNode.getAttribute('name')}-()-${celulas[1].innerText.trim()}-()-${celulas[3].innerText.trim()}-()-${celulas[5].innerText.trim()}-()-${celulas[2].innerText.trim()}-()-${celulas[4].innerText.trim() || ''}-++-`;
            } else if (aba == 'Usuários') {
                data = celulas[1].innerText.trim();
                let senha = '';
                if (celulas[4].innerText != '' && celulas[4].innerText != '\n') {
                    senha = celulas[4].innerText
                } else {
                    senha = CryptoJS.SHA256('12345').toString();
                }
                const userRef = db.collection('users').doc(data);

                userRef.get().then((doc) => {
                    const novoUsuario = {
                        nome: celulas[2].innerText.trim(),
                        criado_em: firebase.firestore.FieldValue.serverTimestamp(),
                        credencial: celulas[3].innerText.trim()
                    };

                    // Só define a senha se o documento ainda não existir
                    if (!doc.exists || celulas[4].innerText == '' || celulas[4].innerText == '\n') {
                        novoUsuario.senha = senha;
                    }

                    userRef.set(novoUsuario, { merge: true }) // 'merge' evita sobrescrever campos não especificados
                        .then(() => {
                            console.log('Usuário salvo com sucesso.');
                        })
                        .catch((error) => {
                            console.error('Erro ao salvar usuário:', error);
                        });
                });
            }
            let ja_enviado = sessionStorage.getItem('ja_enviado' + aba) || '';
            if (!ja_enviado.includes(newData)) {
                let docRef = '';
                if (aba == 'Rotinas' || (aba == 'Chamadas' && (document.getElementById('modal_msg_rapida').style.display == 'none' || document.getElementById('modal_msg_rapida').style.display == '')) || aba == 'OS') {
                    docRef = db.collection(aba.toLowerCase()).doc(data.toISOString());
                } else if (aba == 'Chamadas' && document.getElementById('modal_msg_rapida').style.display == 'block') {
                    docRef = db.collection('dados_fixos').doc('chamadas_pre_prontas');
                } else {
                    docRef = db.collection('dados_fixos').doc('qth');
                }
                docRef.get().then((docSnapshot) => {
                    if (docSnapshot.exists) {
                        // Documento existe, vamos pegar os dados antigos
                        let existingData = docSnapshot.data();
                        if (!JSON.stringify(existingData).includes(td.parentNode.getAttribute('name'))) {
                            if (aba == 'Rotinas') {
                                existingData[cad] += newData;
                            } else if (aba == 'Chamadas' && (document.getElementById('modal_msg_rapida').style.display == 'none' || document.getElementById('modal_msg_rapida').style.display == '')) {
                                existingData['chamadas'] += newData;
                            } else if (aba == 'OS') {
                                existingData['os'] += newData;
                            } else if (aba == 'Chamadas' && document.getElementById('modal_msg_rapida').style.display == 'block') {
                                existingData['chamadas_pre_prontas'] += newData;
                            } else if (aba == 'Setores') {
                                existingData['qth'] += newData;
                            }
                            sessionStorage.setItem('ja_enviado' + aba, JSON.stringify(existingData));
                        } else {
                            let dado_antigo = JSON.stringify(existingData).substring(JSON.stringify(existingData).indexOf(td.parentNode.getAttribute('name'),)).substring(0, JSON.stringify(existingData).substring(JSON.stringify(existingData).indexOf(td.parentNode.getAttribute('name'),)).indexOf('-++-') + 4);
                            existingData = JSON.parse(JSON.stringify(existingData).replaceAll(dado_antigo, ''));
                            if (aba == 'Rotinas') {
                                existingData[cad] += newData;
                            } else if (aba == 'Chamadas' && (document.getElementById('modal_msg_rapida').style.display == 'none' || document.getElementById('modal_msg_rapida').style.display == '')) {
                                existingData['chamadas'] += newData;
                            } else if (aba == 'Chamadas' && document.getElementById('modal_msg_rapida').style.display == 'block') {
                                existingData['chamadas_pre_prontas'] += newData;
                            } else if (aba == 'OS') {
                                existingData['os'] += newData;
                            } else if (aba == 'Setores') {
                                existingData['qth'] += newData;
                            }
                            sessionStorage.setItem('ja_enviado' + aba, JSON.stringify(existingData));

                        }
                        docRef.set({ ...existingData })
                            .then(() => {
                                clearInterval(interval_envio);
                                if (aba == 'Rotinas') {
                                    fecha_ultimo_horario(celulas);
                                }

                            })
                            .catch((error) => { console.error("Erro ao atualizar o documento:", error); clearInterval(interval_envio) });

                    } else {
                        let dados = '';
                        if (aba == 'Rotinas') {
                            dados = {
                                'norte': '',
                                'sul': '',
                                'centro': '',
                                'especializadas': ''
                            }
                            dados[cad] = newData;
                        } else if (aba == 'Chamadas' && (document.getElementById('modal_msg_rapida').style.display == 'none' || document.getElementById('modal_msg_rapida').style.display == '')) {
                            dados = { 'chamadas': newData };
                        } else if (aba == 'Chamadas' && document.getElementById('modal_msg_rapida').style.display == 'block') {
                            dados = { 'chamadas_pre_prontas': newData };
                        } else if (aba == 'OS') {
                            dados = { 'os': newData };
                        }
                        sessionStorage.setItem('ja_enviado' + aba, JSON.stringify(dados));
                        // Documento não existe, apenas cria com os novos dados
                        docRef.set(dados)
                            .then(() => {
                                clearInterval(interval_envio);
                                fecha_ultimo_horario(celulas);

                            })
                            .catch((error) => { console.error("Erro ao criar o documento:", error); clearInterval(interval_envio) });
                    }
                });
            }
        }
    }, 100);

}

function fecha_ultimo_horario(celulas) {
    let hora = new Date().toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false, // usa o formato 24h
    });
    // Filtra as rotinas da GU que ainda não têm um horário final (td[6] vazio)
    let rotinas_da_gu = Array.from(document.querySelectorAll('#rotinas_table tbody tr')).filter(linha => {
        return linha.innerText.includes(celulas[1].innerText) && linha.querySelectorAll('td')[6].innerText == '';
    });

    // Certifique-se de que temos pelo menos duas rotinas
    if (rotinas_da_gu.length >= 2) {
        const penultima_rotina = rotinas_da_gu[rotinas_da_gu.length - 2];

        if (penultima_rotina) {
            const tdFinal = penultima_rotina.querySelectorAll('td')[6];

            // Verifica se o td[6] está vazio antes de atribuir a hora
            if (tdFinal && tdFinal.innerText.trim() === '') {
                tdFinal.innerText = hora;

                // Chama a função de envio de dados, se necessário
                enviar_dados(tdFinal);
            } else {
                console.error("Erro: Não foi possível atualizar o horário final.");
            }
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("toggle-dark-mode");

    if (localStorage.getItem("modo-escuro") === "ativado") {
        document.body.classList.add("dark-mode");
        toggle.textContent = "☀️";
    }
    if (localStorage.getItem("ordem_tabelas")) {
        if (localStorage.getItem('ordem_tabelas').split('-()-')[0].includes('copiar_selecionados')) {
            document.querySelector('#rotinas_table thead').innerHTML = localStorage.getItem('ordem_tabelas').split('-()-')[0];
        }
        document.querySelector('#chamadas_table thead').innerHTML = localStorage.getItem('ordem_tabelas').split('-()-')[1];
        if (localStorage.getItem('ordem_tabelas').split('-()-')[2].includes('copiar_selecionados')) {
            document.querySelector('#equipes_table thead').innerHTML = localStorage.getItem('ordem_tabelas').split('-()-')[2];
        }
        if (localStorage.getItem('ordem_tabelas').split('-()-')[3] && localStorage.getItem('ordem_tabelas').split('-()-')[3].includes('excluir_selecionados')) {
            document.querySelector('#os_table thead').innerHTML = localStorage.getItem('ordem_tabelas').split('-()-')[3];
        }
    }

    toggle.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        const modoEscuroAtivo = document.body.classList.contains("dark-mode");
        localStorage.setItem("modo-escuro", modoEscuroAtivo ? "ativado" : "desativado");
        toggle.textContent = modoEscuroAtivo ? "☀️" : "🌙";
    });


    const filtro_rotinas = localStorage.getItem('filtro_rotinas');
    if (filtro_rotinas && filtro_rotinas.split('-()-')[9]) {
        document.querySelector('#rotina_data_inicial').value = filtro_rotinas.split('-()-')[0];
        document.querySelector('#rotina_data_final').value = filtro_rotinas.split('-()-')[1];
        document.querySelector('#num_periodo_relativo').value = filtro_rotinas.split('-()-')[2];
        document.querySelector('#select_tipo_periodo').value = filtro_rotinas.split('-()-')[3];
        document.querySelector('#rotina_checkbox_norte').checked = filtro_rotinas.split('-()-')[4] === 'true';
        document.querySelector('#rotina_checkbox_sul').checked = filtro_rotinas.split('-()-')[5] === 'true';
        document.querySelector('#rotina_checkbox_centro').checked = filtro_rotinas.split('-()-')[6] === 'true';
        document.querySelector('#rotina_checkbox_especializadas').checked = filtro_rotinas.split('-()-')[7] === 'true';
        document.querySelector('#num_pregistros_rotinas').value = filtro_rotinas.split('-()-')[9];
    }
    const filtro_chamadas = localStorage.getItem('filtro_chamadas');
    if (filtro_chamadas) {
        document.querySelector('#chamadas_data_inicial').value = filtro_chamadas.split('-()-')[0];
        document.querySelector('#chamadas_data_final').value = filtro_chamadas.split('-()-')[1];

    }
    const filtro_os = localStorage.getItem('filtro_os');
    if (filtro_os) {
        document.querySelector('#os_data_inicial').value = filtro_os.split('-()-')[0];
        document.querySelector('#os_data_final').value = filtro_os.split('-()-')[1];

    }
    const filtro_equipes = localStorage.getItem('filtro_equipes');
    if (filtro_equipes) {
        const inputs = document.querySelectorAll('#filtro_equipes input');
        const valores = filtro_equipes.split('-()-');
        for (let index = 0; index < inputs.length; index++) {
            const input = inputs[index];
            if (input.type == 'datetime-local') {
                input.value = valores[index];
            } else {
                input.checked = valores[index] == 'true';
            }
        }

    }
    let interval_logado = setInterval(() => {
        if (sessionStorage.getItem('usuario_logado')) {
            document.querySelector('#saudacoes').innerHTML = `Olá, GCM ${JSON.parse(sessionStorage.getItem('usuario_logado')).nome}.`;
            if (JSON.parse(sessionStorage.getItem('usuario_logado')).credencial == '3') {
                document.querySelector('#aba_usuários').style.display = '';
            }
            document.querySelectorAll("#rotinas_table tbody tr,#chamadas_pre_prontas_table tbody tr,#chamadas_table tbody tr,#os_table tbody tr,#setores_table tbody tr").forEach(tr => {
                tr.setAttribute('name', JSON.parse(sessionStorage.getItem('usuario_logado')).nome + '-**-' + new Date().getTime());
            });
            clearInterval(interval_logado);
            //clicar no tipo de período armazenado banco
            if (filtro_rotinas && filtro_rotinas.split('-()-')[8]) {
                document.querySelector(`#${filtro_rotinas.split('-()-')[8]}`).click();
            }
            filtrar_dados('rotinas');
            filtrar_dados('chamadas');
            filtrar_dados('equipes');
            filtrar_dados('os');
            baixa_banco();
            if (localStorage.getItem('config_abas')) {
                Array.from(document.querySelectorAll('button[class*="tab-button"]')).filter(button => button.innerText == localStorage.getItem('config_abas'))[0].click();
            }
            let selectionBox;
            let startX, startY;

            document.addEventListener('mousedown', (e) => {
                if (e.button !== 0) return; // Só botão esquerdo
                if (!(e.target.tagName == 'BODY' || e.target.tagName == 'HTML')) return;
                e.preventDefault();

                startX = e.pageX;
                startY = e.pageY;

                selectionBox = document.createElement('div');
                selectionBox.className = 'selection-box';
                selectionBox.style.left = `${startX}px`;
                selectionBox.style.top = `${startY}px`;
                document.body.appendChild(selectionBox);
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });

            function onMouseMove(e) {
                if (!selectionBox) return;
                document.body.style.userSelect = 'none';
                const currentX = e.pageX;
                const currentY = e.pageY;

                const width = Math.abs(currentX - startX);
                const height = Math.abs(currentY - startY);

                selectionBox.style.width = `${width}px`;
                selectionBox.style.height = `${height}px`;

                selectionBox.style.left = `${Math.min(currentX, startX)}px`;
                selectionBox.style.top = `${Math.min(currentY, startY)}px`;
                const items = document.querySelectorAll('.div_tabela_registros tbody tr');
                const boxRect = selectionBox.getBoundingClientRect();

                items.forEach(item => {
                    const itemRect = item.getBoundingClientRect();
                    const isInside = !(
                        itemRect.right < boxRect.left ||
                        itemRect.left > boxRect.right ||
                        itemRect.bottom < boxRect.top ||
                        itemRect.top > boxRect.bottom
                    );

                    if (item?.querySelector('input[type=checkbox]')) {
                        if (isInside) {
                            item.querySelector('input[type=checkbox]').checked = true;
                        } else {
                            item.querySelector('input[type=checkbox]').checked = false;
                        }
                    }

                });
            }

            function onMouseUp(e) {
                if (!selectionBox) return;
                // Verificar colisão com itens
                document.body.style.userSelect = '';

                selectionBox.remove();
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            }
        }
    }, 100);
    document.querySelectorAll('th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            // Remove classes anteriores
            th.closest('table').querySelectorAll('th').forEach(header => {
                header.classList.remove('sorted-asc', 'sorted-desc');
            });
            const index = Array.from(th.closest('thead').querySelectorAll('th')).indexOf(th);
            let linhas = Array.from(th.closest('table').querySelectorAll('tbody tr')).map((l) => l.querySelectorAll('td')[index].innerText + '-&&-' + l.outerHTML + '-&&-' + l.querySelector('input[type=checkbox]')?.checked);
            if (th.closest('table').getAttribute('id') != 'equipes_table') {
                linhas.pop();
            }

            if (!th.getAttribute('asc')) {
                th.closest('table').querySelectorAll('th').forEach(header => {
                    header.classList.remove('sorted-asc', 'sorted-desc');
                    header.removeAttribute('desc');
                    header.removeAttribute('asc');
                });
                th.classList.add('sorted-asc');
                th.setAttribute('asc', 'a');
                linhas.sort().reverse();
            } else {
                th.closest('table').querySelectorAll('th').forEach(header => {
                    header.classList.remove('sorted-asc', 'sorted-desc');
                    header.removeAttribute('desc');
                    header.removeAttribute('asc');
                });
                th.classList.add('sorted-desc');
                th.setAttribute('desc', 'a');
                linhas.sort();
            }
            if (th.closest('table').getAttribute('id') != 'equipes_table') {
                th.closest('table').querySelector('tbody').innerHTML = th.closest('table').querySelector('tbody tr:last-child').outerHTML;
                linhas.forEach(l => {
                    th.closest('table').querySelector('tbody tr:last-child').insertAdjacentHTML('beforebegin', l.split('-&&-')[1]);
                    if (th.closest('table').querySelector('tbody tr:last-child').previousElementSibling.querySelector('input[type=checkbox]')) {
                        th.closest('table').querySelector('tbody tr:last-child').previousElementSibling.querySelector('input[type=checkbox]').checked = l.split('-&&-')[2] == 'true';
                    }
                });
            } else {
                th.closest('table').querySelector('tbody').innerHTML = '';
                linhas = linhas.map((l) => l.split('-&&-')[1]).forEach(l => {
                    th.closest('table').querySelector('tbody').insertAdjacentHTML('afterbegin', l);
                });
            }

            localStorage.setItem('ordem_tabelas', document.querySelector('#rotinas_table thead').innerHTML + '-()-' + document.querySelector('#chamadas_table thead').innerHTML + '-()-' + document.querySelector('#equipes_table thead').innerHTML + '-()-' + document.querySelector('#os_table thead').innerHTML);
        });

    });
    document.querySelectorAll('.dropdown').forEach(item => {
        const button = item.querySelector('.dropdown-button');

        button.addEventListener('click', () => {
            item.classList.toggle('show');
        });

        // Fecha o dropdown se clicar fora
        window.addEventListener('click', (e) => {
            if (!item.contains(e.target)) {
                item.classList.remove('show');
            }
        });
    });
    if (sessionStorage.getItem('usuario_logado')) {
        document.querySelector('#login').style.display = 'none';
        document.querySelector('#programa').style.display = '';
    } else {
        localStorage.removeItem('manterConectado');
    }

    document.querySelectorAll('#seleciona_periodo_absoluto input:not([type=radio]),#seleciona_periodo_relativo input:not([type=radio]),#seleciona_periodo_relativo select').forEach(input => {
        input.addEventListener('click', function () {
            input.parentNode.parentNode.querySelector('input[type=radio]').click();
        })
    })

    //se o usuario setar periodo relativo na aba Rotinas, ele vai ficar monitorando e excluindo localmente os registros fora do período
    setInterval(() => {
        const linhas = document.querySelectorAll('#rotinas_table tbody tr');
        if (document.querySelector("#seleciona_periodo_relativo > input[type=radio]").checked) {

            if (document.querySelector("#select_tipo_periodo").value != '0') {
                const data_inicial_filtro = new Date();
                const minutos = parseInt(document.querySelector("#num_periodo_relativo").value) * parseInt(document.querySelector("#select_tipo_periodo").value)
                data_inicial_filtro.setMinutes(data_inicial_filtro.getMinutes() - minutos);
                linhas.forEach(linha => {
                    let data_hora_registro = linha.querySelectorAll('td')[5].innerText.split(/\/|, |:/);
                    if (data_hora_registro.length == 5) {
                        data_hora_registro = new Date(parseInt(data_hora_registro[2]), parseInt(data_hora_registro[1]) - 1, parseInt(data_hora_registro[0]), parseInt(data_hora_registro[3]), parseInt(data_hora_registro[4]));
                        if (!isNaN(data_hora_registro) && (data_hora_registro < data_inicial_filtro || data_hora_registro > new Date()) && !linha.contains(document.activeElement)) {
                            linha.remove();
                        }
                    }
                })
            }
        }
        let ja_corrigidos = '';
        const ultimos_registros = parseInt(document.querySelector("#num_pregistros_rotinas").value);
        linhas.forEach(linha => {
            if (!linha) return;
            let qra = linha.querySelectorAll('td')[1].innerText.trim()
            if (!ja_corrigidos.includes(qra)) {
                const celulas = Array.from(linhas).filter(l => l.querySelectorAll('td')[1].innerText.trim() == qra);
                for (let index = 0; index < celulas.length - ultimos_registros; index++) {
                    celulas[index].style.display = 'none';
                }
                ja_corrigidos += qra;
            }
        })


    }, 1000);



});

function ultimos_registros(tabela) {
    document.querySelectorAll(`#${tabela}_table tbody tr`).forEach(linha => {
        linha.style.display = '';
    });
    guardar_filtro('rotinas');

}

function blockEvent(e) {
    e.preventDefault();
}

function setInputsDisabled(element, disabled) {

    if (disabled) {
        // Para input number, usamos readonly que bloqueia edição mas permite foco e clique
        element.setAttribute('readonly', 'readonly');

        // Para select, não existe readonly, então bloqueamos via evento
        element.disabled = false; // para poder ouvir eventos
        element.addEventListener('mousedown', blockEvent);
        element.addEventListener('keydown', blockEvent);
    } else {
        element.removeAttribute('readonly');
        element.disabled = false;
        element.removeEventListener('mousedown', blockEvent);
        element.removeEventListener('keydown', blockEvent);
    }
}

function filtro_equipes_todas(checkbox) {
    for (let index = 1; index < checkbox.parentNode.parentNode.querySelectorAll('input').length; index++) {
        checkbox.parentNode.parentNode.querySelectorAll('input')[index].checked = checkbox.checked;
    }
    filtro_equipes();
}

function filtro_equipes() {
    if (document.querySelector('#filtro_areas input:not([value=Todas]):not(:checked)')) {
        document.querySelector('#filtro_areas input').checked = false;
    } else {
        document.querySelector('#filtro_areas input').checked = true;
    }
    if (document.querySelector('#filtro_tipo input:not([value=Todas]):not(:checked)')) {
        document.querySelector('#filtro_tipo input').checked = false;
    } else {
        document.querySelector('#filtro_tipo input').checked = true;
    }
    const linhas = document.querySelectorAll('#equipes_table tbody tr');
    const areas = ['200 Cruzeiro', '300 Partenon', '400 Leste', '500 Restinga', '600 Norte', '700 Eixo Baltazar', '800 Pinheiro', '900 Sul', '1000 Romu', '1100 Patam', '1200 Centro', 'Comando', 'cogm'];
    const primeiro_char = ['2', '3', '4', '5', '6', '7', '8', '9', 'R', 'P', 'C', 'A', 'S'];
    let ultimo_registro = {};
    linhas.forEach(linha => {
        const id = linha.getAttribute('name');
        const gu = linha.querySelectorAll('td')[2].innerText.trim();
        const horario = linha.querySelectorAll('td')[1].innerText.trim().split(/[/,: ]+/);
        if (!ultimo_registro[gu] || ultimo_registro[gu].time < new Date(horario[2], horario[1], horario[0], horario[3], horario[4]).getTime()) {
            ultimo_registro[gu] = {
                'guarnicao': gu,
                'time': new Date(horario[2], horario[1], horario[0], horario[3], horario[4]).getTime(),
                'id': id
            }
        }
    });

    linhas.forEach(linha => {
        linha.style.display = 'none';
        let areas_ativo = '';
        let tipo_ativo = '';
        let somente_ultima_ativo = '';
        let texto_procurado_ativo = '';


        //análise de área
        const gu = linha.querySelectorAll('td')[2].innerText;
        if (gu.includes('Dia') || gu.includes('Noite')) {
            if (Array.from(document.querySelectorAll('#filtro_areas input')).filter(input => input.value == areas[primeiro_char.indexOf(gu.trim().substring(0, 1))])[0]) {
                areas_ativo = Array.from(document.querySelectorAll('#filtro_areas input')).filter(input => input.value == areas[primeiro_char.indexOf(gu.trim().substring(0, 1))])[0].checked;
            }
        } else {
            areas_ativo = Array.from(document.querySelectorAll('#filtro_areas input')).filter(input => input.value == areas[primeiro_char.indexOf(gu.split('- ')[1].trim().substring(0, 1))])[0].checked;
        }


        //análise do tipo
        const func_modelo = linha.querySelectorAll('td')[4].innerText;
        if (func_modelo.trim() == 'Automóvel' || func_modelo.trim() == 'Câmera Corporal') {
            tipo_ativo = document.querySelector('#filtro_tipo input[value="Equipamentos"]').checked;
        } else {
            tipo_ativo = document.querySelector('#filtro_tipo input[value="Pessoas"]').checked;
        }

        //análise da última
        if (document.querySelector('input[value=somente_ultima]').checked) {
            if (ultimo_registro[gu.trim()] && ultimo_registro[gu.trim()].id == linha.getAttribute('name')) {
                somente_ultima_ativo = true;
            } else {
                somente_ultima_ativo = false;
            }
        } else {
            somente_ultima_ativo = true;
        }

        //análise de texto procurado
        const texto_procurado = document.querySelector('#filtro_equipes input[type=text]').value.toLowerCase();
        if (!texto_procurado == '') {
            if (linha.innerText.toLowerCase().includes(texto_procurado)) {
                texto_procurado_ativo = true;
            } else {
                texto_procurado_ativo = false;
            }
        } else {
            texto_procurado_ativo = true;
        }



        if (areas_ativo && tipo_ativo && somente_ultima_ativo && texto_procurado_ativo) {
            linha.style.display = '';
        }

    });
    guardar_filtro('equipes');
}

function guardar_filtro(filtro) {
    if (filtro == 'rotinas') {
        localStorage.setItem('filtro_rotinas', `${document.querySelector('#rotina_data_inicial').value}-()-${document.querySelector('#rotina_data_final').value}-()-${document.querySelector('#num_periodo_relativo').value}-()-${document.querySelector('#select_tipo_periodo').value}-()-${document.querySelector('#rotina_checkbox_norte').checked}-()-${document.querySelector('#rotina_checkbox_sul').checked}-()-${document.querySelector('#rotina_checkbox_centro').checked}-()-${document.querySelector('#rotina_checkbox_especializadas').checked}-()-${document.querySelector('#filtro input:not([type=radio]):not([readonly])').parentNode.parentNode.getAttribute('id')}-()-${document.querySelector('#num_pregistros_rotinas').value}`);
    } else if (filtro == 'chamadas') {
        localStorage.setItem('filtro_chamadas', `${document.querySelector('#chamadas_data_inicial').value}-()-${document.querySelector('#chamadas_data_final').value}`);
    } else if (filtro == 'os') {
        localStorage.setItem('filtro_os', `${document.querySelector('#os_data_inicial').value}-()-${document.querySelector('#os_data_final').value}`);
    } else {
        let valores = [];
        document.querySelectorAll('#filtro_equipes input').forEach(input => {
            if (input.type == 'datetime-local') {
                valores.push(input.value);
            } else {
                valores.push(input.checked);
            }
        })
        localStorage.setItem('filtro_equipes', valores.join('-()-'));
    }
}

function seleciona_periodo(tipo_periodo) {
    document.querySelectorAll('#seleciona_periodo_absoluto input:not([type=radio]),#seleciona_periodo_relativo input:not([type=radio]),#seleciona_periodo_relativo select').forEach(input => {
        setInputsDisabled(input, true);
    });
    tipo_periodo.parentNode.querySelectorAll('input:not([type=radio]),select').forEach(input => {
        setInputsDisabled(input, false);
    });
    tipo_periodo.parentNode.querySelector('input:not([type=radio])').dispatchEvent(new Event('input', { bubbles: true }));
}

function empenhar_gu(demanda) {
    const aba = document.querySelector('[class="tab-button ativo"]').innerText;
    let dados = demanda.closest('tr').querySelectorAll('td');
    let id = JSON.parse(sessionStorage.getItem('usuario_logado')).nome + '-**-' + new Date().getTime();
    let endereco, tipo_local, qth, narrativa, natureza, telefone, solicitante;
    if (aba == 'Chamadas') {
        endereco = dados[5].innerText.trim();
        tipo_local = 'Residência';
        qth = 'DEM ';
        narrativa = dados[3].innerText;
        natureza = dados[4].innerText;
        telefone = dados[2].innerText;
        solicitante = dados[1].innerText;
        let qths = localStorage.getItem('qth').split('-++-')
        qths.forEach(item => {
            if (endereco == item.split('-()-')[1]?.trim()) {
                qth += item.split('-()-')[1].trim();
                endereco = item.split('-()-')[4].trim();
                tipo_local = item.split('-()-')[2].trim();
            }
        });
        if (qth == 'DEM ') {
            qth += natureza;
        }
    } else if (aba == 'OS') {
        endereco = dados[5].innerText.trim();
        if (dados[4].innerText.trim() == '') {
            qth = 'OS ' + dados[1].innerText.trim();
            tipo_local = 'Via urbana';
        } else {
            let qths = localStorage.getItem('qth').split('-++-');
            tipo_local = qths.find(item => item.split('-()-')[1]?.trim() == dados[4].innerText.trim());
            if (tipo_local) {
                tipo_local = tipo_local.split('-()-')[2].trim();
            } else {
                tipo_local = 'Via urbana';
            }
            qth = 'OS ' + dados[4].innerText.trim();
        }
        narrativa = dados[1].innerText + '\n' + dados[2].innerText;
        natureza = dados[3].innerText;
        telefone = '';
        solicitante = '';
    }
    let dados_demanda = `${qth}-()-${tipo_local}-()-${narrativa}-()-${endereco}-()-${natureza}-()-_QRA_-()-_QTR_INICIAL_-()-_QRU_-()-_QTR_FINAL_-()-${telefone}-()-${solicitante}-++-`;
    document.querySelector('button[class="tab-button"]').click();
    let linha = criar_linha('rotinas', [id, qth, tipo_local, narrativa, endereco, natureza, '', new Date().toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false, // usa o formato 24h
    }), '', '', telefone, solicitante]);
    document.querySelector('#rotinas_table tbody tr:last-child').insertAdjacentHTML('beforeBegin', linha);
    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth"
    });
    document.querySelector('#rotinas_table tbody tr:last-child').previousElementSibling.querySelectorAll('td')[1].focus();
}


function turno_atual(button) {
    const hora = new Date().getHours();
    let seletores_data = button.parentNode.parentNode.querySelectorAll('input[type*=date]');
    if (hora > 18 || hora < 6) {

        seletores_data[0].value = new Date(new Date().setHours(15, 30, 0)).toISOString().slice(0, -5);
        seletores_data[0].dispatchEvent(new Event('input', { bubbles: true }));

        const data_final = new Date();
        data_final.setDate(data_final.getDate() + 1);
        seletores_data[1].value = new Date(data_final.setHours(3, 30, 0)).toISOString().slice(0, -5);
        seletores_data[1].dispatchEvent(new Event('input', { bubbles: true }));
    } else {
        seletores_data[0].value = new Date(new Date().setHours(3, 30, 0)).toISOString().slice(0, -5);
        seletores_data[0].dispatchEvent(new Event('input', { bubbles: true }));
        seletores_data[1].value = new Date(new Date().setHours(15, 30, 0)).toISOString().slice(0, -5);
        seletores_data[1].dispatchEvent(new Event('input', { bubbles: true }));
    }
}

async function excluir_linha(button, todos) {
    const row = button.closest('tr');
    const celulas = row.querySelectorAll('td');
    const aba = document.querySelector('button.tab-button.ativo').innerText;
    const id = row.getAttribute('name');

    let confirmacao = todos || confirm(`Você realmente deseja excluir o registro:\n${celulas[1]?.innerText} - ${celulas[2]?.innerText} - ${celulas[3]?.innerText} - ${celulas[4]?.innerText}?`);
    if (!confirmacao) return;

    const atualizarFirestore = async (colecao, docId) => {
        let docRef;
        if (document.getElementById('modal_msg_rapida').style.display == 'block') {
            docRef = db.collection('dados_fixos').doc('chamadas_pre_prontas');
        } else {
            docRef = db.collection(colecao).doc(docId);
        }
        const snapshot = await docRef.get();
        if (!snapshot.exists) return true;

        const dados = snapshot.data();
        const dadosStr = JSON.stringify(dados);

        if (!dadosStr.includes(id)) return true;

        const inicio = dadosStr.indexOf(id);
        const fim = dadosStr.indexOf('-++-', inicio);
        const dadoAntigo = dadosStr.substring(inicio, fim + 4);
        const novoStr = dadosStr.replace(dadoAntigo, '');

        try {
            const dadosAtualizados = JSON.parse(novoStr);
            await docRef.set(dadosAtualizados);
            sessionStorage.setItem('ja_enviado' + aba, JSON.stringify(dadosAtualizados));

            return true;
        } catch (e) {
            console.error("Erro ao atualizar Firestore:", e);
        }
    };

    if (aba === 'Rotinas' && celulas[5]?.innerText.includes('/')) {
        const [dia, mes, anoRaw] = celulas[5].innerText.split('/');
        const ano = anoRaw.split(',')[0];
        const data = new Date(ano, parseInt(mes) - 1, parseInt(dia));
        const bancoAtualizado = await atualizarFirestore(aba.toLowerCase(), data.toISOString());
        if (bancoAtualizado) document.querySelector(`#${aba.toLowerCase()} [name="${id}"]`)?.remove();
    } else if (aba === 'Chamadas' || aba === 'OS') {
        const timestamp = parseInt(id.split('-**-')[1]);
        const data = new Date(new Date(timestamp).toDateString()); // normaliza para YYYY-MM-DD
        const bancoAtualizado = await atualizarFirestore(aba.toLowerCase(), data.toISOString());
        if (bancoAtualizado) document.querySelector(`#${aba.toLowerCase()} [name="${id}"]`)?.remove();
    } else if (aba === 'Setores') {
        const bancoAtualizado = await atualizarFirestore('dados_fixos', 'qth');
        if (bancoAtualizado) document.querySelector(`#${aba.toLowerCase()} [name="${id}"]`)?.remove();
    } else {
        celulas[1]?.focus();
        celulas[1]?.blur();
        document.querySelector(`#${aba.toLowerCase()} [name="${id}"]`)?.remove();
    }
}

function selecionar_tudo(checkbox) {
    checkbox.closest('table').querySelectorAll('input[type="checkbox"]:not([onchange])').forEach(check => {
        if (check.closest('tr').style.display != 'none') {
            check.checked = checkbox.checked;
        }
    });
}
function copiar_selecionados() {
    const aba = document.querySelector('button.tab-button.ativo').innerText;
    let texto = '';
    let copiados = localStorage.getItem('copiados') || '';
    document.querySelectorAll(`#${aba.toLowerCase()}_table tbody tr`).forEach(tr => {
        if (tr.querySelector('input[type=checkbox]').checked == true) {
            tr.querySelector('svg').setAttribute('class', 'copiar_clicado');
            copiados += tr.getAttribute('name');
            texto += copiar_dados(tr.querySelector('svg'), true);
            tr.querySelector('input[type=checkbox]').checked = false;
        }
    })
    document.querySelector(`#${aba.toLowerCase()}_table thead input[type=checkbox]`).checked = false;
    localStorage.setItem('copiados', copiados);
    navigator.clipboard.writeText(texto);
    const msg = document.createElement('div');
    msg.textContent = 'Copiado';
    msg.style.position = 'absolute';
    msg.style.top = '0';
    msg.style.left = '100%'; // ou ajuste como preferir
    msg.style.background = '#007bff';
    msg.style.color = '#fff';
    msg.style.padding = '4px 8px';
    msg.style.borderRadius = '10px';
    msg.style.zIndex = '9999'; // ← garante que fique por cima

    const wrapper = document.querySelector(`#${aba.toLowerCase()}_table thead span`);
    const rect = wrapper.getBoundingClientRect();

    msg.style.position = 'fixed';
    msg.style.top = `${rect.top - 30}px`;     // 30px acima do span
    msg.style.left = `${rect.left + rect.width / 2}px`;
    msg.style.transform = 'translateX(-50%)';
    msg.style.transition = 'opacity 0.3s';

    document.body.appendChild(msg);

    // remove após 1s
    setTimeout(() => msg.remove(), 1000);


}

async function excluir_selecionados() {
    const confirmar = confirm('Deseja realmente excluir todos esses registros?');
    if (!confirmar) return;

    const aba = document.querySelector('button.tab-button.ativo').innerText.toLowerCase();
    const tabela = document.querySelector(`#${aba}_table`);
    if (!tabela) return;

    const linhasSelecionadas = Array.from(tabela.querySelectorAll('tbody tr')).filter(tr => {
        const checkbox = tr.querySelector('input[type=checkbox]');
        if (aba === 'rotinas') {
            const data_inicial = tr.querySelectorAll('td')[5].innerText;
            return checkbox && checkbox.checked && data_inicial != '';
        } else if (aba === 'chamadas') {
            const qtr = tr.querySelectorAll('td')[9].innerText;
            return checkbox && checkbox.checked && qtr != '';
        } else if (aba === 'os') {
            return checkbox && checkbox.checked;
        }


    });
    console.log(linhasSelecionadas);
    if (!linhasSelecionadas.length) return;

    // Agrupar por docId
    const grupos = {};

    for (const tr of linhasSelecionadas) {
        const id = tr.getAttribute('name');
        const celulas = tr.querySelectorAll('td');
        let docId = '';

        if (aba === 'rotinas' && celulas[5]?.innerText.includes('/')) {
            const [d, m, yRaw] = celulas[5].innerText.split('/');
            const y = yRaw.split(',')[0];
            docId = new Date(y, parseInt(m) - 1, parseInt(d)).toISOString();
        } else if (aba === 'chamadas' || aba == 'os') {
            const timestamp = parseInt(id.split('-**-')[1]);
            docId = new Date(new Date(timestamp).toDateString()).toISOString();
        } else {
            tr.remove(); // Para 'setores' ou outros
            continue;
        }

        if (!grupos[docId]) grupos[docId] = [];
        grupos[docId].push({ id, tr });
    }

    // Para cada docId, fazer exclusão consolidada
    const promises = Object.entries(grupos).map(async ([docId, registros]) => {
        const docRef = db.collection(aba).doc(docId);
        const snapshot = await docRef.get();

        if (!snapshot.exists) {
            registros.forEach(r => r.tr.remove());
            return;
        }

        let dados = JSON.stringify(snapshot.data());

        registros.forEach(({ id }) => {
            const inicio = dados.indexOf(id);
            const fim = dados.indexOf('-++-', inicio);
            if (inicio >= 0 && fim > inicio) {
                const dadoAntigo = dados.substring(inicio, fim + 4);
                dados = dados.replace(dadoAntigo, '');
            }
        });

        try {
            const atualizado = JSON.parse(dados);
            await docRef.set(atualizado);
            registros.forEach(r => r.tr.remove());
        } catch (err) {
            console.error(`Erro ao excluir no doc ${docId}:`, err);
        }
    });

    await Promise.all(promises);
}

function abrir_legislacao_modal(modal) {
    if (modal == 'legislacao') { document.querySelector('#modal').style.display = 'block'; }
    else { document.querySelector('#modalCodigos').style.display = 'block'; }
}

function fechar_modal() {
    document.querySelector('#modal').style.display = 'none';
    document.querySelector('#modal_msg_rapida').style.display = 'none';
    document.querySelector('#modalCodigos').style.display = 'none';
}

function abrir_filtro_avancado(tabela) {
    tabela.closest('tr').nextElementSibling.style.display = tabela.closest('tr').nextElementSibling.style.display == 'none' ? '' : 'none';
    tabela.innerHTML = tabela.innerHTML == '←' ? '↓' : '←';
}

function msg_rapida(but) {
    const linha = but.closest('tr').getAttribute('name');
    sessionStorage.setItem('msg_rapida', linha);
    document.querySelector('#modal_msg_rapida').style.display = 'block';
}

function seleciona_pre_pronta(but) {
    const dados = Array.from(but.closest('tr').querySelectorAll('td')).map(celula => celula.innerText);
    document.querySelector('#modal_msg_rapida').style.display = 'none';
    const celulas = document.querySelectorAll(`#chamadas_table tr[name="${sessionStorage.getItem('msg_rapida')}"] td`);
    sessionStorage.removeItem('msg_rapida');
    for (let index = 1; index < 9; index++) {
        celulas[index].innerText = dados[index];
    }
    celulas[1].focus();
    celulas[1].dispatchEvent(new Event('input', { bubbles: true }));
}

function duplicar(botao) {
    const duplicada = botao.closest('tr').cloneNode(true);
    duplicada.setAttribute('name', JSON.parse(sessionStorage.getItem('usuario_logado')).nome + '-**-' + new Date().getTime());
    botao.closest('tr').after(duplicada);
}

function duplicar_selecionados() {
    const selecionadas = document.querySelectorAll('#os_table tbody [type="checkbox"]:checked');
    selecionadas.forEach(botao => {
        botao.checked = false;
        duplicar(botao);
    })
}

function filtro_os() {
    const filtro = document.querySelector('#filtro_os [type=text]').value.toLowerCase();
    const linhas = document.querySelectorAll('#os_table tbody tr');
    for (let index = 0; index < linhas.length - 1; index++) {
        linhas[index].style.display = 'none';
        if (linhas[index].innerText.toLowerCase().includes(filtro)) {
            linhas[index].style.display = '';
        }
    }
}

function copiar_outro_dia() {
    const input = document.getElementById("outro_dia_data");
    input.style.display = "inline-block";
    input.showPicker?.(); // abre o seletor de data (suportado em Chrome/Edge)
}

function outro_dia_selecionar_data() {
    const input = document.getElementById("outro_dia_data");
    let dia = input.value.split('-');
    dia = `${dia[2]}/${dia[1]}/${dia[0]}`;
    input.style.display = 'none';
    input.value = "";
    const selecionadas = document.querySelectorAll('#os_table tbody [type="checkbox"]:checked');
    let atraso = 0;
    selecionadas.forEach(botao => {
        setTimeout(() => {
            const duplicada = botao.closest('tr').cloneNode(true);
            duplicada.setAttribute('name', JSON.parse(sessionStorage.getItem('usuario_logado')).nome + '-**-' + new Date().getTime());
            const inicio = duplicada.querySelectorAll('td')[7];
            const fim = duplicada.querySelectorAll('td')[8];
            const data_inicio = toDate(inicio.innerText.replaceAll(' ', ''));
            const data_fim = toDate(fim.innerText.replaceAll(' ', ''));
            const diferenca = data_fim - data_inicio;
            inicio.innerText = `${dia}, ${inicio.innerText.replaceAll(' ', '').split(',')[1]}`;
            fim.innerText = formatarData(new Date(toDate(inicio.innerText).getTime() + diferenca));
            enviar_dados(duplicada.querySelectorAll('td')[3]);
        }, atraso);
        atraso = atraso + 500;
    })
}

function toDate(dataStr) {
    const [dia, mes, resto] = dataStr.split("/");
    const [ano, horaMin] = resto.split(",");
    const [hora, minuto] = horaMin.split(":");

    // criar objeto Date
    const data = new Date(ano, mes - 1, dia, hora, minuto);
    return data;
}

function formatarData(data) {
    const resultado =
        data.toLocaleDateString("pt-BR") + ", " +
        data.toTimeString().slice(0, 5);
    return resultado;
}

function copiar_resumo_chamadas() {
    /*Denúncias 153 - 1
    Denúncias WhatsApp - 1
    Total de Ligações - 1
    Apoio ao Samu - 1
    */
    let text = '';
    const th = document.querySelectorAll('#resumo_chamadas th');
    const td = document.querySelectorAll('#resumo_chamadas td');
    for (let index = 0; index < th.length; index++) {
        text += th[index].innerText + ' - ' + td[index].innerText + '\n';
    }
    navigator.clipboard.writeText(text);
}

async function notificar(mensagem) {
    // Se o usuário ainda não decidiu
    if (Notification.permission === "default") {
        const permissao = await Notification.requestPermission();

        if (permissao !== "granted") {
            return; // não insiste
        }
    }

    // Se já estiver liberado
    if (Notification.permission === "granted") {
        new Notification("Rotinas / Chamadas", {
            body: mensagem,
        });
    }
}