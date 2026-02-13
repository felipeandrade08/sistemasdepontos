# ⏰ Sistema de Pontos - Gestão de Equipe

Um sistema moderno e completo para gestão de ponto eletrônico e acompanhamento de equipes, construído com React, TypeScript e Vite.

[![Deploy on Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/seu-usuario/sistemasdepontos)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Instalação](#-instalação)
- [Uso](#-uso)
- [Deploy](#-deploy)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Configuração](#-configuração)
- [Solução de Problemas](#-solução-de-problemas)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

## 🎯 Sobre o Projeto

O **Sistema de Pontos** é uma aplicação web moderna para controle de jornada de trabalho, permitindo:

- ✅ Registro de entrada e saída de funcionários
- 📊 Dashboard com métricas em tempo real
- 👥 Gestão completa de colaboradores
- 📈 Relatórios detalhados de horas trabalhadas
- 🤖 Integração com IA generativa (Gemini)
- 📱 Interface responsiva e intuitiva

## ✨ Funcionalidades

### 🕐 Registro de Ponto
- Marcação de entrada/saída com timestamp preciso
- Histórico completo de registros
- Validação de horários
- Cálculo automático de horas trabalhadas

### 📊 Dashboard
- Visão geral da equipe
- Gráficos de produtividade
- Estatísticas em tempo real
- Alertas e notificações

### 👥 Gestão de Funcionários
- Cadastro completo de colaboradores
- Edição de informações
- Controle de status (ativo/inativo)
- Histórico individual

### 📈 Relatórios
- Relatórios por período
- Exportação de dados
- Análise de horas extras
- Gráficos interativos

### 🤖 IA Generativa
- Logo gerado dinamicamente
- Insights inteligentes
- Análise de padrões de trabalho

## 🚀 Tecnologias

### Frontend
- **React 19** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite 6** - Build tool ultra-rápida
- **Tailwind CSS** - Framework CSS utility-first
- **Lucide React** - Ícones modernos
- **Recharts** - Biblioteca de gráficos
- **date-fns** - Manipulação de datas

### IA & APIs
- **Google Gemini AI** - IA generativa
- **@google/genai** - SDK oficial

### Ferramentas de Desenvolvimento
- **PostCSS** - Processador CSS
- **Autoprefixer** - Prefixos CSS automáticos
- **ESM** - Módulos ES nativos

## 📦 Instalação

### Pré-requisitos

```bash
Node.js >= 18.0.0
npm >= 9.0.0
```

### Passos

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/sistemasdepontos.git
cd sistemasdepontos
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente (opcional)**
```bash
cp .env.example .env
```

Edite o arquivo `.env` e adicione sua chave API do Gemini:
```env
GEMINI_API_KEY=sua_chave_api_aqui
```

> 💡 **Obtenha sua chave em:** https://makersuite.google.com/app/apikey

4. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

O aplicativo estará disponível em: **http://localhost:3000**

## 🎮 Uso

### Comandos Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento

# Build
npm run build            # Cria build de produção
npm run preview          # Preview do build de produção

# Testes
./test-build.sh          # Testa o build localmente
```

### Primeiro Acesso

1. Acesse http://localhost:3000
2. Faça login com credenciais de teste (se configurado)
3. Explore o dashboard e funcionalidades

## 🌐 Deploy

### Deploy no Vercel (Recomendado)

#### Método 1: Via GitHub

```bash
# 1. Push para o GitHub
git add .
git commit -m "Initial commit"
git push origin main

# 2. No Vercel Dashboard
# - Importe seu repositório
# - O Vercel detectará automaticamente as configurações
# - Clique em "Deploy"
```

#### Método 2: Via Vercel CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy para produção
vercel --prod
```

### Configuração no Vercel

**Build Settings:**
- Framework: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

**Environment Variables:**
- `GEMINI_API_KEY`: (opcional)

### Outras Plataformas

O projeto também funciona em:
- ✅ Netlify
- ✅ GitHub Pages
- ✅ AWS S3 + CloudFront
- ✅ Firebase Hosting

📖 **Guia detalhado:** [DEPLOY-VERCEL.md](DEPLOY-VERCEL.md)

## 📁 Estrutura do Projeto

```
sistemasdepontos/
│
├── 📂 components/              # Componentes React
│   ├── GenerativeLogo.tsx     # Logo com IA
│   └── Login.tsx              # Tela de login
│
├── 📂 pages/                   # Páginas principais
│   ├── ClockIn.tsx            # Registro de ponto
│   ├── Dashboard.tsx          # Dashboard
│   ├── Employees.tsx          # Gestão de equipe
│   └── Reports.tsx            # Relatórios
│
├── 📂 services/                # Lógica de negócio
│   └── storage.ts             # Gerenciamento de dados
│
├── 📄 App.tsx                  # Componente raiz
├── 📄 index.tsx                # Entry point
├── 📄 types.ts                 # Tipos TypeScript
├── 🎨 styles.css               # Estilos globais
│
├── ⚙️ vite.config.ts           # Config Vite
├── 🎨 tailwind.config.js       # Config Tailwind
├── 📦 package.json             # Dependências
├── 🌐 vercel.json              # Config Vercel
│
└── 📚 README.md                # Este arquivo
```

## ⚙️ Configuração

### Variáveis de Ambiente

```env
# .env (opcional)
GEMINI_API_KEY=sua_chave_aqui
```

### Personalização do Tailwind

Edite `tailwind.config.js`:

```javascript
export default {
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        // Suas cores personalizadas
      },
    },
  },
}
```

### Configuração do Vite

Edite `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    port: 3000,        // Sua porta
    host: '0.0.0.0',   // Host
  },
  // Mais configurações...
})
```

## 🐛 Solução de Problemas

### ❌ Erro: "Module not found"

```bash
rm -rf node_modules package-lock.json
npm install
```

### ❌ Erro: "Port already in use"

```bash
npm run dev -- --port 3001
```

### ❌ Erro no Build

```bash
# Teste o build localmente
npm run build

# Use o script de teste
./test-build.sh
```

### ❌ Tailwind não funciona

Verifique se `styles.css` está importado em `index.tsx`:

```typescript
import './styles.css';  // ✅ Deve estar presente
```

### ❌ Erro no Vercel (Permission denied)

**Solução:** Os arquivos `vercel.json` e `package.json` já estão configurados corretamente.

1. Limpe o cache no Vercel: Settings → Clear Build Cache
2. Force rebuild: `git commit --allow-empty -m "rebuild" && git push`

📖 **Mais soluções:** [GUIA-COMPLETO.md](GUIA-COMPLETO.md)

## 📊 Performance

- ⚡ **Build otimizado** com code splitting
- 📦 **Bundle reduzido** (~200kb gzip)
- 🎨 **CSS minificado** automaticamente
- 🚀 **Lazy loading** de componentes
- 💾 **Cache eficiente** com Vite

## 🔒 Segurança

- ✅ Validação de inputs
- 🔐 Variáveis de ambiente seguras
- 🛡️ Proteção contra XSS
- 🔒 HTTPS em produção

## 🤝 Contribuindo

Contribuições são bem-vindas!

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/MinhaFeature`
3. Commit: `git commit -m 'Adiciona MinhaFeature'`
4. Push: `git push origin feature/MinhaFeature`
5. Abra um Pull Request

### Diretrizes

- ✅ Mantenha o código limpo
- ✅ Siga os padrões TypeScript
- ✅ Adicione testes quando possível
- ✅ Atualize a documentação

## 📝 Changelog

### [1.0.0] - 2026-02-13

**Adicionado:**
- ✨ Sistema de registro de ponto
- 📊 Dashboard com métricas
- 👥 Gestão de funcionários
- 📈 Relatórios detalhados
- 🤖 Integração IA Gemini

**Corrigido:**
- 🐛 Erro Tailwind CDN
- 🔧 Build no Vercel
- ⚡ Otimizações de performance

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

## 👥 Autor

**Seu Nome**
- GitHub: [@felipeandrade08](https://github.com/felipeandrade08)
- Email: felipe.pessoall2026@gmail.com

## 🙏 Agradecimentos

- [React Team](https://react.dev)
- [Vite](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Google Gemini AI](https://deepmind.google/technologies/gemini/)

## 📞 Suporte

- 📧 **Email:** felipe.pessoall2026@gmail.com
- 🐛 **Issues:** [GitHub Issues](https://github.com/felipeandrade08/sistemasdepontos/issues)
- 💬 **Discussões:** [GitHub Discussions](https://github.com/felipeandrade08/sistemasdepontos/discussions)

## 🌟 Mostre seu Apoio

Se este projeto foi útil, considere dar uma ⭐️!

---

## 🗺️ Roadmap

- [ ] Autenticação JWT
- [ ] Notificações push
- [ ] App mobile (React Native)
- [ ] Exportação PDF
- [ ] Integração folha de pagamento
- [ ] PWA (modo offline)
- [ ] Multi-idiomas (i18n)
- [ ] Tema escuro
- [ ] API REST

## 📚 Documentação

- 📖 [Guia Completo](GUIA-COMPLETO.md)
- 🚀 [Deploy Vercel](DEPLOY-VERCEL.md)
- 🔧 [Troubleshooting](GUIA-COMPLETO.md#solução-de-problemas)

---

<div align="center">

**⚡ Built with Vite | 🎨 Styled with Tailwind | 🧠 Powered by AI**

Feito com ❤️ usando React + TypeScript

[⬆ Voltar ao topo](#-sistema-de-pontos---gestão-de-equipe)

</div>
