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

## 4. Agendamento do bloqueio e teste de pagamento

A migration `20261125000100_schedule_subscription_block.sql` agenda o bloqueio geral para 2026-12-01. Aplique-a no projeto Supabase (`supabase db push`) para gravar a data no `system_settings`. A partir dessa data, contas sem assinatura válida e fora dos 30 dias de teste ficam bloqueadas. O teste começa na criação da conta; cada pagamento confirmado pelo webhook libera por mais 30 dias.

Para testar sem cobrar um cartão real, use um Payment Link e endpoint de webhook em modo de teste, com chaves `sk_test_` e o segredo `whsec_` desse endpoint. Depois do pagamento, confirme no Supabase que `profiles.plan_expires_at` recebeu uma data 30 dias à frente e `profiles.status` voltou para `Ativo`. Para produção, use o Payment Link live e o endpoint/secrets live correspondentes.
