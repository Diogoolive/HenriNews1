import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { supabase } from '../lib/supabase';

type Props = {
  voltar: () => void;
};

export default function CadastroScreen({ voltar }: Props) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function cadastrar() {
    const nomeLimpo = nome.trim();
    const emailLimpo = email.trim().toLowerCase();

    if (!nomeLimpo || !emailLimpo || !senha || !confirmarSenha) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }

    if (senha.length < 8) {
      Alert.alert('Senha inválida', 'A senha precisa ter pelo menos 8 caracteres.');
      return;
    }

    if (senha !== confirmarSenha) {
      Alert.alert('Senha inválida', 'As duas senhas precisam ser iguais.');
      return;
    }

    try {
      setCarregando(true);

      const { data, error } = await supabase.auth.signUp({
        email: emailLimpo,
        password: senha,
        options: {
          data: {
            full_name: nomeLimpo,
          },
        },
      });

      if (error) {
        Alert.alert('Erro no cadastro', error.message);
        return;
      }

      setNome('');
      setEmail('');
      setSenha('');
      setConfirmarSenha('');

      if (data.session) {
        Alert.alert('HenriNews', 'Cadastro realizado com sucesso!');
      } else {
        Alert.alert(
          'Cadastro realizado',
          'Confira seu e-mail para confirmar a conta antes de entrar.',
          [{ text: 'OK', onPress: voltar }]
        );
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Erro', 'Não foi possível realizar o cadastro.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={voltar} style={styles.voltarArea}>
          <Text style={styles.voltar}>← Voltar para o login</Text>
        </Pressable>

        <View style={styles.card}>
          <Text style={styles.logo}>HenriNews</Text>
          <Text style={styles.titulo}>Crie sua conta</Text>
          <Text style={styles.subtitulo}>
            Cadastre-se para acessar notícias, biblioteca e enquetes.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Nome completo"
            value={nome}
            onChangeText={setNome}
            autoCapitalize="words"
          />

          <TextInput
            style={styles.input}
            placeholder="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Senha (mínimo 8 caracteres)"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
          />

          <TextInput
            style={styles.input}
            placeholder="Confirmar senha"
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            secureTextEntry
          />

          <Pressable
            style={[styles.botao, carregando && styles.botaoDesativado]}
            onPress={cadastrar}
            disabled={carregando}
          >
            {carregando ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.botaoTexto}>Criar conta</Text>
            )}
          </Pressable>

          <Text style={styles.info}>
            O tipo de conta é definido automaticamente pelo e-mail cadastrado.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  voltarArea: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  voltar: {
    color: '#4f46e5',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 20,
    elevation: 3,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4f46e5',
    marginBottom: 24,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  subtitulo: {
    color: '#64748b',
    marginTop: 6,
    marginBottom: 24,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  botao: {
    backgroundColor: '#4f46e5',
    padding: 15,
    borderRadius: 12,
    marginTop: 4,
  },
  botaoDesativado: {
    opacity: 0.6,
  },
  botaoTexto: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  info: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 16,
    textAlign: 'center',
  },
});
