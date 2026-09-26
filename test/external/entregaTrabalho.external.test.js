import { expect } from 'chai';
import { comTokenAdmin, getToken } from '../helpers/auth.js';
import { api } from '../helpers/api.js';
import dadosEntregaTrabalho from '../fixtures/entregaTrabalho.json' with { type: 'json' };

const { cenariosFluxoCompleto, cenarioAlunoNaoMatriculado, cenarioAcessoNegado } = dadosEntregaTrabalho;

function comSufixoUnico(base, sufixo) {
  return {
    nome: base.nome,
    email: `${base.emailBase}.${sufixo}@example.com`,
    matricula: `MAT-${sufixo}`,
    senha: base.senha,
  };
}

async function cadastrarAluno(tokenAdmin, dadosAluno) {
  const resposta = await api()
    .post('/api/admin/alunos')
    .set('Content-Type', 'application/json')
    .set('Authorization', tokenAdmin)
    .send(dadosAluno);

  return resposta;
}

async function cadastrarDisciplina(tokenAdmin, dadosDisciplina) {
  const resposta = await api()
    .post('/api/admin/disciplinas')
    .set('Content-Type', 'application/json')
    .set('Authorization', tokenAdmin)
    .send(dadosDisciplina);

  return resposta;
}

async function matricularAluno(tokenAdmin, disciplinaId, alunoId) {
  const resposta = await api()
    .post(`/api/admin/disciplinas/${disciplinaId}/matriculas`)
    .set('Content-Type', 'application/json')
    .set('Authorization', tokenAdmin)
    .send({ alunoId });

  return resposta;
}

async function registrarEntregaTrabalho(tokenAluno, alunoId, dadosEntrega) {
  const resposta = await api()
    .post(`/api/alunos/${alunoId}/trabalhos`)
    .set('Content-Type', 'application/json')
    .set('Authorization', `Bearer ${tokenAluno}`)
    .send(dadosEntrega);

  return resposta;
}

describe('Fluxo completo: admin cadastra aluno, aluno faz login e registra a entrega de um trabalho', function () {
  this.timeout(10000);

  cenariosFluxoCompleto.forEach((cenario, indice) => {
    it(cenario.testTitle, async () => {
      const sufixo = `${Date.now()}-${indice}`;
      const dadosAluno = comSufixoUnico(cenario.dadosAluno, sufixo);
      const dadosDisciplina = {
        nome: cenario.dadosDisciplina.nome,
        codigo: `${cenario.dadosDisciplina.codigoBase}-${sufixo}`,
        cargaHoraria: cenario.dadosDisciplina.cargaHoraria,
      };

      // 1. Login como administrador
      const tokenAdmin = await comTokenAdmin();

      // 2. Cadastrar um aluno
      const respostaCadastroAluno = await cadastrarAluno(tokenAdmin, dadosAluno);
      expect(respostaCadastroAluno.status).to.equal(201);
      expect(respostaCadastroAluno.body).to.include({
        nome: dadosAluno.nome,
        email: dadosAluno.email,
        matricula: dadosAluno.matricula,
      });
      const alunoId = respostaCadastroAluno.body.id;

      // Pré-condição de negócio: para entregar um trabalho o aluno precisa estar
      // matriculado na disciplina (ver trabalhos.service.js -> registrar()).
      const respostaCadastroDisciplina = await cadastrarDisciplina(tokenAdmin, dadosDisciplina);
      expect(respostaCadastroDisciplina.status).to.equal(201);
      const disciplinaId = respostaCadastroDisciplina.body.id;

      const respostaMatricula = await matricularAluno(tokenAdmin, disciplinaId, alunoId);
      expect(respostaMatricula.status).to.equal(201);

      // 3. Login como o aluno recém-cadastrado
      const tokenAluno = await getToken(dadosAluno.email, dadosAluno.senha);
      expect(tokenAluno).to.be.a('string').and.not.empty;

      // 4. Registrar a entrega do trabalho como aluno
      const respostaEntregaTrabalho = await registrarEntregaTrabalho(tokenAluno, alunoId, {
        disciplinaId,
        titulo: cenario.dadosTrabalho.titulo,
        descricao: cenario.dadosTrabalho.descricao,
      });

      expect(respostaEntregaTrabalho.status).to.equal(201);
      expect(respostaEntregaTrabalho.body).to.include({
        alunoId,
        disciplinaId,
        titulo: cenario.dadosTrabalho.titulo,
        descricao: cenario.dadosTrabalho.descricao,
        status: 'entregue',
        nota: null,
        feedback: null,
      });
      expect(respostaEntregaTrabalho.body.id).to.be.a('string');
      expect(new Date(respostaEntregaTrabalho.body.dataEntrega).getTime()).to.be.closeTo(Date.now(), 5000);
    });
  });
});

describe('Regras de negócio ao registrar a entrega de um trabalho', function () {
  this.timeout(10000);

  it(cenarioAlunoNaoMatriculado.testTitle, async () => {
    const sufixo = `nao-matriculado-${Date.now()}`;
    const dadosAluno = comSufixoUnico(cenarioAlunoNaoMatriculado.dadosAluno, sufixo);
    const dadosDisciplina = {
      nome: cenarioAlunoNaoMatriculado.dadosDisciplina.nome,
      codigo: `${cenarioAlunoNaoMatriculado.dadosDisciplina.codigoBase}-${sufixo}`,
      cargaHoraria: cenarioAlunoNaoMatriculado.dadosDisciplina.cargaHoraria,
    };

    const tokenAdmin = await comTokenAdmin();

    const respostaCadastroAluno = await cadastrarAluno(tokenAdmin, dadosAluno);
    expect(respostaCadastroAluno.status).to.equal(201);
    const alunoId = respostaCadastroAluno.body.id;

    // A disciplina existe, mas o aluno propositalmente NÃO é matriculado nela.
    const respostaCadastroDisciplina = await cadastrarDisciplina(tokenAdmin, dadosDisciplina);
    expect(respostaCadastroDisciplina.status).to.equal(201);
    const disciplinaId = respostaCadastroDisciplina.body.id;

    const tokenAluno = await getToken(dadosAluno.email, dadosAluno.senha);

    const respostaEntregaTrabalho = await registrarEntregaTrabalho(tokenAluno, alunoId, {
      disciplinaId,
      titulo: cenarioAlunoNaoMatriculado.dadosTrabalho.titulo,
      descricao: cenarioAlunoNaoMatriculado.dadosTrabalho.descricao,
    });

    expect(respostaEntregaTrabalho.status).to.equal(cenarioAlunoNaoMatriculado.statusCodeEsperado);
    expect(respostaEntregaTrabalho.body).to.include({
      error: cenarioAlunoNaoMatriculado.mensagemErroEsperada,
    });
  });

  it(cenarioAcessoNegado.testTitle, async () => {
    const sufixo = `acesso-negado-${Date.now()}`;
    const dadosAlunoAutenticado = comSufixoUnico(cenarioAcessoNegado.dadosAlunoAutenticado, `autenticado-${sufixo}`);
    const dadosAlunoAlvo = comSufixoUnico(cenarioAcessoNegado.dadosAlunoAlvo, `alvo-${sufixo}`);

    const tokenAdmin = await comTokenAdmin();

    const respostaAlunoAutenticado = await cadastrarAluno(tokenAdmin, dadosAlunoAutenticado);
    expect(respostaAlunoAutenticado.status).to.equal(201);

    const respostaAlunoAlvo = await cadastrarAluno(tokenAdmin, dadosAlunoAlvo);
    expect(respostaAlunoAlvo.status).to.equal(201);
    const alunoAlvoId = respostaAlunoAlvo.body.id;

    // O middleware authorizeSelfOrAdmin bloqueia antes de validar disciplina/trabalho,
    // então o corpo da requisição não precisa referenciar uma disciplina real.
    const tokenAlunoAutenticado = await getToken(dadosAlunoAutenticado.email, dadosAlunoAutenticado.senha);

    const respostaEntregaTrabalho = await registrarEntregaTrabalho(tokenAlunoAutenticado, alunoAlvoId, {
      disciplinaId: 'disciplina-inexistente',
      titulo: cenarioAcessoNegado.dadosTrabalho.titulo,
      descricao: cenarioAcessoNegado.dadosTrabalho.descricao,
    });

    expect(respostaEntregaTrabalho.status).to.equal(cenarioAcessoNegado.statusCodeEsperado);
    expect(respostaEntregaTrabalho.body).to.include({
      error: cenarioAcessoNegado.mensagemErroEsperada,
    });
  });
});
