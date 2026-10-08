import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../lib/supabase';

export default function SuporteScreen({ voltar }: { voltar: () => void }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => { preencherUsuario(); }, []);

  async function preencherUsuario() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setEmail(user.email || '');
    const { data } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .maybeSingle();

    if (data?.full_name) setNome(data.full_name);
    if (data?.email) setEmail(data.email);
  }

  async function enviar() {
    if (!nome.trim() || !email.trim() || !mensagem.trim()) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }

    setEnviando(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('help_questions').insert({
      user_id: user?.id || null,
      name: nome.trim(),
      email: email.trim().toLowerCase(),
      message: mensagem.trim(),
    });
    setEnviando(false);

    if (error) {
      Alert.alert('Erro', error.message);
      return;
    }

    setMensagem('');
    Alert.alert('HenriNews', 'Pergunta enviada com sucesso!');
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable onPress={voltar}><Text style={styles.voltar}>← Voltar</Text></Pressable>
        <Text style={styles.titulo}>Ajuda & Suporte</Text>
        <Text style={styles.subtitulo}>Envie sua dúvida para a equipe responsável.</Text>

        <Text style={styles.label}>Nome</Text>
        <TextInput style={styles.input} value={nome} onChangeText={setNome} />

        <Text style={styles.label}>E-mail</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Sua dúvida</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={mensagem}
          onChangeText={setMensagem}
          multiline
          textAlignVertical="top"
          placeholder="Digite sua pergunta..."
        />

        <Pressable style={styles.botao} onPress={enviar} disabled={enviando}>
          <Text style={styles.botaoTexto}>{enviando ? 'Enviando...' : 'Enviar pergunta'}</Text>
        </Pressable>

        <Text style={styles.faqTitulo}>Perguntas frequentes</Text>
        <Text style={styles.faqPergunta}>Como funciona a devolução de livros?</Text>
        <Text style={styles.faqResposta}>Consulte o prazo em “Meus Empréstimos” e devolva o exemplar na biblioteca.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingBottom: 40 },
  voltar: { color: '#4f46e5', fontWeight: '600', marginBottom: 18 },
  titulo: { fontSize: 28, fontWeight: 'bold', color: '#0f172a' },
  subtitulo: { color: '#64748b', marginTop: 5, marginBottom: 24 },
  label: { color: '#334155', fontWeight: '700', marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, padding: 13, fontSize: 16 },
  textarea: { minHeight: 130 },
  botao: { backgroundColor: '#4f46e5', padding: 14, borderRadius: 12, marginTop: 18 },
  botaoTexto: { color: '#fff', textAlign: 'center', fontWeight: '700' },
  faqTitulo: { fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginTop: 30 },
  faqPergunta: { fontWeight: '700', color: '#334155', marginTop: 14 },
  faqResposta: { color: '#64748b', marginTop: 5, lineHeight: 20 },
});
