import request from 'supertest';
import { expect } from 'chai';
import { comTokenAdmin, getToken } from '../helpers/auth.js';
import 'dotenv/config';
import { api } from '../helpers/api.js';
import { novoAluno } from '../factories/alunosFactory.js';
import { novaDisciplina } from '../factories/disciplinasFactory.js';

describe('Disciplinas', () => {
    let token;
    beforeEach(async () => {
        token = await getToken(process.env.ADMIN_EMAIL, process.env.ADMIN_SENHA);
    })

    /*1) POST /auth/login
POST /admin/alunos
 POST /admin/disciplinas
 POST /admin/disciplinas/{id}/matriculas */
    it('deve cadastrar disciplinas com usuário admin', async () => {
        const codigoDisciplina = `MAT-${Date.now()}`
        const horaTeste = new Date().toISOString()

        const respostaCadastro = await api()
        .post('/api/admin/disciplinas')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
            'nome': "Matemática de Testes",
            'codigo': codigoDisciplina,
            'cargaHoraria': 60
        })

        console.log(respostaCadastro.body)

        expect(respostaCadastro.status).to.equal(201);
        expect(respostaCadastro.body.id).not.to.be.null;
        expect(respostaCadastro.body.nome).to.equal('Matemática de Testes')
        expect(respostaCadastro.body.codigo).to.equal(codigoDisciplina)
        expect(respostaCadastro.body.cargaHoraria).to.equal(60);
        expect(new Date(respostaCadastro.body.createdAt)).to.be.a('date')
        expect(new Date(respostaCadastro.body.createdAt).getTime()).to.be.closeTo(Date.now(), 5000) // tolerância de 5s

    })

    it('deve matricular aluno na disciplina com sucesso', async () => {

        const cadastroAlunoResposta  = await api()
        .post('/api/admin/alunons')
        .set('Content-Tyoe', 'application/json')
        .set('Authorization', await comTokenAdmin())
        .send(novoAluno())

        const alunoId = cadastroAlunoResposta.body.id; 

        const codigoDisciplina = `MAT-${Date.now()}`

        const cadastroDisciplinaResposta = await api ()
        .post('/api/admin/disciplinas')
        .set('Content-Tyoe', 'application/json')
        .set('Authorization', await comTokenAdmin())
        .send(novaDisciplina())

        const disciplinaId = cadastroAlunoResposta.body.id;

        console.log(disciplinaId)
    })
})