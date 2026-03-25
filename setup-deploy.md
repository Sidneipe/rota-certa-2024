# 🚀 Configuração de Deploy Automático

## 📋 Passos para Configurar

### 1. Gerar Chave de Serviço Firebase

Execute no terminal:
```bash
firebase projects:list
```

Copie o ID do projeto: `rotaflex-132c3`

### 2. Criar Service Account

Acesse: https://console.cloud.google.com/iam-admin/serviceaccounts

1. Selecione o projeto: `rotaflex-132c3`
2. Clique em "Criar Conta de Serviço"
3. Nome: `github-actions-deploy`
4. Role: `Firebase Admin`
5. Clique em "Criar"
6. Vá em "Chaves" → "Adicionar Chave" → "Criar nova chave"
7. Tipo: JSON
8. Baixe o arquivo JSON

### 3. Configurar Secrets no GitHub

Vá para: https://github.com/SEU-USUARIO/rota-certa/settings/secrets

Adicione estes secrets:

#### `FIREBASE_SERVICE_ACCOUNT`
- Cole todo o conteúdo do arquivo JSON baixado

#### `FIREBASE_TOKEN` (opcional)
- Use o token gerado anteriormente:
  ```
  [REMOVIDO_FOR_SECURITY]
  ```

### 4. Fazer Push para GitHub

```bash
git add .
git commit -m "🚀 Adiciona deploy automático com GitHub Actions"
git push origin main
```

## 🔄 Como Funciona

### Deploy Automático (Main/Master)
- Toda vez que fizer push para `main` ou `master`
- Build automático
- Deploy para produção: https://rotaflex-132c3.web.app

### Preview Deploy (Pull Requests)
- Toda vez que abrir/atualizar um PR
- Build automático
- Deploy para preview: https://rotaflex-132c3--pr-NUMERO.web.app
- Comentário automático no PR com link

## 📊 Monitoramento

Acesse: https://github.com/SEU-USUARIO/rota-certa/actions

Para ver:
- Status dos deploys
- Logs de erro
- Histórico de builds

## 🛠️ Comandos Úteis

```bash
# Verificar status do workflow
gh workflow list

# Disparar workflow manualmente
gh workflow run "Deploy to Firebase Hosting"

# Verificar logs do último deploy
gh run view --log
```

## ⚠️ Importante

- O primeiro deploy pode levar alguns minutos
- Verifique os secrets se houver erro de permissão
- O preview é atualizado a cada novo commit no PR

## 🎯 Resultado Final

✅ Deploy automático configurado
✅ Preview para cada PR
✅ Build otimizado
✅ Deploy rápido e confiável
