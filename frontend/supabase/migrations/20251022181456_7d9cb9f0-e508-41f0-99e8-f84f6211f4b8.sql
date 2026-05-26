-- Criar usuário admin Eduardo
-- Nota: Este é um método direto para criar o primeiro usuário admin
-- A senha Goku@123 será hasheada corretamente pelo sistema

DO $$
DECLARE
  user_id uuid;
BEGIN
  -- Cria o usuário na tabela auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'eduardon@transbernal.com',
    crypt('Goku@123', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"login":"eduardon","nome":"Eduardo"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO user_id;

  -- Cria identidade do usuário
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    user_id,
    user_id::text,
    jsonb_build_object(
      'sub', user_id::text,
      'email', 'eduardon@transbernal.com',
      'email_verified', true
    ),
    'email',
    NOW(),
    NOW(),
    NOW()
  );

  RAISE NOTICE 'Usuário Eduardo criado com sucesso! ID: %', user_id;
END $$;