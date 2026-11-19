# Configuração do webhook de pagamentos

## 1. Aplicar a migração e publicar a função

Na raiz do projeto, com o Supabase CLI instalado e autenticado:

```sh
supabase link --project-ref SEU_PROJECT_REF
supabase db push
supabase secrets set STRIPE_SECRET_KEY=sk_live_... STRIPE_WEBHOOK_SECRET=whsec_...
supabase functions deploy stripe-webhook
```

`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` são fornecidos ao ambiente da Edge Function pelo Supabase. Configure somente as duas chaves Stripe como secrets. Nunca coloque chaves `sk_`, `whsec_` ou a service role no frontend ou no repositório.

## 2. Cadastrar o endpoint no Stripe

No Stripe Dashboard, crie um destino de webhook com URL:

```text
https://SEU_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
```

Selecione os eventos `checkout.session.completed` e `checkout.session.async_payment_succeeded`. Copie o segredo de assinatura do endpoint (`whsec_...`) para `STRIPE_WEBHOOK_SECRET`. Use o endpoint e as chaves do mesmo modo (test ou live).

## 3. Configurar o retorno do Payment Link

No Payment Link, configure a ação após o pagamento para redirecionar ao domínio publicado do app, com `?payment=success` (por exemplo, `https://SEU_DOMINIO/?payment=success`). O navegador apenas mostra o retorno; o webhook assinado é quem ativa a conta. O modal consulta o status periodicamente e fecha após o Supabase registrar a confirmação.

O processamento valida assinatura Stripe, moeda BRL, valor de R$ 4,99 e e-mail do checkout contra um perfil existente. Eventos repetidos não estendem a assinatura novamente.
