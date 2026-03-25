# 🚀 RotaFlex - Sistema de Gerenciamento de Entregas

Sistema completo para gerenciamento de entregas e motoristas, com importação de PDFs e otimização de rotas.

## 🌐 Aplicação em Produção

**URL:** https://rotaflex-132c3.web.app

## 📋 Funcionalidades

- ✅ Importação de arquivos PDF e planilhas
- ✅ Criação automática de grupos de rotas
- ✅ Gerenciamento de motoristas
- ✅ Histórico de importações
- ✅ Interface moderna e responsiva
- ✅ Deploy automático com GitHub Actions

## 🛠️ Desenvolvimento Local

### Pré-requisitos
- Node.js 18+
- MySQL
- Firebase CLI

### Instalação
```bash
# Clonar repositório
git clone <URL-DO-REPOSITORIO>
cd rota-certa

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
```

### Backend
```bash
cd server
npm install
npm run dev
```

### Frontend
```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
npm run dev
```

## 🚀 Deploy

### Deploy Manual
```bash
# Build e deploy para produção
npm run deploy

# Deploy para preview
npm run deploy:preview

# Verificar status
npm run deploy:status
```

### Deploy Automático (GitHub Actions)

O projeto está configurado com CI/CD automático:

- **Push para main/master:** Deploy automático para produção
- **Pull Requests:** Deploy automático para preview
- **Build otimizado:** Geração de build e deploy automático

## 📁 Estrutura do Projeto

```
rota-certa/
├── src/                 # Frontend React
├── server/              # Backend Node.js
├── database/            # Schema MySQL
├── .github/workflows/   # GitHub Actions
├── dist/               # Build para deploy
└── firebase.json       # Configuração Firebase
```

## 🔧 Configuração

### Firebase
- Projeto: `rotaflex-132c3`
- Hosting: https://rotaflex-132c3.web.app
- Functions: Backend (opcional)

### Banco de Dados
- MySQL com schema em `database/schema.sql`
- Tabelas: motoristas, entregas, grupos_rotas, arquivos_importados

## 📊 Monitoramento

- **GitHub Actions:** https://github.com/SEU-USUARIO/rota-certa/actions
- **Firebase Console:** https://console.firebase.google.com/project/rotaflex-132c3
- **Aplicação:** https://rotaflex-132c3.web.app

## 🤝 Como Contribuir

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Faça commit (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

O PR criará automaticamente um preview da sua alteração!

## 📝 Licença

MIT License - veja arquivo LICENSE para detalhes.

---

**Desenvolvido com ❤️ para RotaFlex**

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
