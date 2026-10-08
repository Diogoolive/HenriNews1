import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
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

const SITE_URL = 'https://henrinews.netlify.app/';

export default function RecuperarSenhaScreen({ voltar }: Props) {
  const [email, setEmail] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function enviarRecuperacao() {
    const emailLimpo = email.trim().toLowerCase();

    if (!emailLimpo) {
      Alert.alert('Atenção', 'Informe o seu e-mail cadastrado.');
      return;
    }

    try {
      setCarregando(true);

      const { error } = await supabase.auth.resetPasswordForEmail(emailLimpo, {
        redirectTo: 'https://henrinews.netlify.app/?recovery=1'
      });

      if (error) {
        console.log('Erro na recuperação:', error);
        Alert.alert(
          'Não foi possível enviar',
          'Tente novamente em alguns instantes.'
        );
        return;
      }

      Alert.alert(
        'Verifique seu e-mail',
        'Se esse e-mail estiver cadastrado no HenriNews, você receberá um link para criar uma nova senha. O link abrirá o portal HenriNews para finalizar a alteração.',
        [{ text: 'OK', onPress: voltar }]
      );
    } catch (error) {
      console.log(error);
      Alert.alert('Erro', 'Não foi possível iniciar a recuperação da senha.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.content}>
        <Pressable onPress={voltar} style={styles.voltarArea}>
          <Text style={styles.voltar}>← Voltar para o login</Text>
        </Pressable>

        <View style={styles.card}>
          <Text style={styles.logo}>HenriNews</Text>
          <Text style={styles.titulo}>Recuperar senha</Text>
          <Text style={styles.subtitulo}>
            Digite o e-mail da sua conta. Enviaremos as instruções para você
            criar uma nova senha.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="E-mail cadastrado"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!carregando}
          />

          <Pressable
            style={[styles.botao, carregando && styles.botaoDesativado]}
            onPress={enviarRecuperacao}
            disabled={carregando}
          >
            {carregando ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.botaoTexto}>Enviar instruções</Text>
            )}
          </Pressable>

          <Text style={styles.info}>
            Por segurança, a mensagem será a mesma mesmo que o e-mail não esteja
            cadastrado.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
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
