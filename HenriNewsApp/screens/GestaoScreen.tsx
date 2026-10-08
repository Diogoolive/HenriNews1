import { useEffect, useState } from 'react';
import {
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

export default function GestaoScreen({ voltar }: { voltar: () => void }) {
  const [artTitle, setArtTitle] = useState('');
  const [artImage, setArtImage] = useState('');
  const [artContent, setArtContent] = useState('');

  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookDescription, setBookDescription] = useState('');
  const [bookCopies, setBookCopies] = useState('1');

  const [pollQuestion, setPollQuestion] = useState('');
  const [opA, setOpA] = useState('');
  const [opB, setOpB] = useState('');
  const [opC, setOpC] = useState('');
  const [opD, setOpD] = useState('');
  const [opE, setOpE] = useState('');

  const [loans, setLoans] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);

  useEffect(() => { carregarPainel(); }, []);

  async function carregarPainel() {
    const [loanResult, helpResult] = await Promise.all([
      supabase
        .from('loans')
        .select('id, code, status, requested_at, due_date, profiles(full_name, email), books(title)')
        .order('requested_at', { ascending: false }),
      supabase
        .from('help_questions')
        .select('id, name, email, message, status, created_at')
        .order('created_at', { ascending: false }),
    ]);

    if (!loanResult.error) setLoans(loanResult.data || []);
    if (!helpResult.error) setQuestions(helpResult.data || []);
  }

  async function publicarArtigo() {
    if (!artTitle.trim() || !artContent.trim()) {
      Alert.alert('Atenção', 'Preencha título e conteúdo.');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('articles').insert({
      title: artTitle.trim(),
      content: artContent.trim(),
      image_url: artImage.trim() || null,
      status: 'published',
      author_id: user.id,
    });

    if (error) return Alert.alert('Erro', error.message);
    setArtTitle(''); setArtImage(''); setArtContent('');
    Alert.alert('HenriNews', 'Notícia publicada com sucesso!');
  }

  async function cadastrarLivro() {
    const copies = Number(bookCopies);
    if (!bookTitle.trim() || !bookAuthor.trim() || !Number.isInteger(copies) || copies < 1) {
      Alert.alert('Atenção', 'Preencha título, autor e uma quantidade válida.');
      return;
    }

    const { error } = await supabase.from('books').insert({
      title: bookTitle.trim(),
      author: bookAuthor.trim(),
      description: bookDescription.trim() || null,
      total_copies: copies,
      available_copies: copies,
      active: true,
    });

    if (error) return Alert.alert('Erro', error.message);
    setBookTitle(''); setBookAuthor(''); setBookDescription(''); setBookCopies('1');
    Alert.alert('HenriNews', 'Livro cadastrado com sucesso!');
  }

  async function criarEnquete() {
    const valores = [opA, opB, opC, opD, opE]
      .map((texto, index) => ({ label: ['A', 'B', 'C', 'D', 'E'][index], option_text: texto.trim() }))
      .filter((item) => item.option_text);

    if (!pollQuestion.trim() || valores.length < 2) {
      Alert.alert('Atenção', 'Informe a pergunta e pelo menos duas opções.');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: poll, error } = await supabase
      .from('polls')
      .insert({ question: pollQuestion.trim(), active: true, created_by: user.id })
      .select('id')
      .single();

    if (error) return Alert.alert('Erro', error.message);

    const { error: optionsError } = await supabase
      .from('poll_options')
      .insert(valores.map((item) => ({ ...item, poll_id: poll.id })));

    if (optionsError) {
      await supabase.from('polls').delete().eq('id', poll.id);
      return Alert.alert('Erro', optionsError.message);
    }

    setPollQuestion(''); setOpA(''); setOpB(''); setOpC(''); setOpD(''); setOpE('');
    Alert.alert('HenriNews', 'Enquete criada com sucesso!');
  }

  async function registrarDevolucao(id: number) {
    const { error } = await supabase.rpc('return_book_loan', { p_loan_id: id });
    if (error) return Alert.alert('Erro', error.message);
    await carregarPainel();
    Alert.alert('HenriNews', 'Devolução registrada.');
  }

  async function resolverPergunta(id: number) {
    const { error } = await supabase
      .from('help_questions')
      .update({ status: 'resolved' })
      .eq('id', id);

    if (error) return Alert.alert('Erro', error.message);
    await carregarPainel();
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable onPress={voltar}><Text style={styles.voltar}>← Voltar</Text></Pressable>
        <Text style={styles.titulo}>Painel de Gestão</Text>
        <Text style={styles.subtitulo}>Ferramentas disponíveis para gestores.</Text>

        <Secao titulo="Publicar notícia">
          <Campo placeholder="Título" value={artTitle} onChangeText={setArtTitle} />
          <Campo placeholder="URL da imagem (opcional)" value={artImage} onChangeText={setArtImage} autoCapitalize="none" />
          <Campo placeholder="Conteúdo da notícia" value={artContent} onChangeText={setArtContent} multiline />
          <Botao texto="Publicar notícia" onPress={publicarArtigo} />
        </Secao>

        <Secao titulo="Cadastrar livro">
          <Campo placeholder="Título" value={bookTitle} onChangeText={setBookTitle} />
          <Campo placeholder="Autor" value={bookAuthor} onChangeText={setBookAuthor} />
          <Campo placeholder="Descrição" value={bookDescription} onChangeText={setBookDescription} multiline />
          <Campo placeholder="Quantidade de exemplares" value={bookCopies} onChangeText={setBookCopies} keyboardType="number-pad" />
          <Botao texto="Cadastrar livro" onPress={cadastrarLivro} />
        </Secao>

        <Secao titulo="Criar enquete">
          <Campo placeholder="Pergunta" value={pollQuestion} onChangeText={setPollQuestion} />
          <Campo placeholder="Opção A" value={opA} onChangeText={setOpA} />
          <Campo placeholder="Opção B" value={opB} onChangeText={setOpB} />
          <Campo placeholder="Opção C (opcional)" value={opC} onChangeText={setOpC} />
          <Campo placeholder="Opção D (opcional)" value={opD} onChangeText={setOpD} />
          <Campo placeholder="Opção E (opcional)" value={opE} onChangeText={setOpE} />
          <Botao texto="Criar enquete" onPress={criarEnquete} />
        </Secao>

        <Secao titulo="Empréstimos ativos">
          {loans.filter((loan) => ['requested', 'borrowed'].includes(loan.status)).length === 0 ? (
            <Text style={styles.vazio}>Nenhum empréstimo ativo.</Text>
          ) : (
            loans
              .filter((loan) => ['requested', 'borrowed'].includes(loan.status))
              .map((loan) => {
                const pessoa = Array.isArray(loan.profiles) ? loan.profiles[0] : loan.profiles;
                const livro = Array.isArray(loan.books) ? loan.books[0] : loan.books;
                return (
                  <View key={loan.id} style={styles.itemPainel}>
                    <Text style={styles.itemTitulo}>{livro?.title || 'Livro'}</Text>
                    <Text style={styles.itemTexto}>{pessoa?.full_name || pessoa?.email || 'Usuário'}</Text>
                    <Text style={styles.itemTexto}>Voucher: {loan.code}</Text>
                    <Text style={styles.itemTexto}>Prazo: {formatarData(loan.due_date)}</Text>
                    <Pressable style={styles.botaoSecundario} onPress={() => registrarDevolucao(loan.id)}>
                      <Text style={styles.botaoSecundarioTexto}>Confirmar devolução</Text>
                    </Pressable>
                  </View>
                );
              })
          )}
        </Secao>

        <Secao titulo="Perguntas de suporte">
          {questions.filter((q) => q.status === 'open').length === 0 ? (
            <Text style={styles.vazio}>Nenhuma pergunta aberta.</Text>
          ) : (
            questions.filter((q) => q.status === 'open').map((q) => (
              <View key={q.id} style={styles.itemPainel}>
                <Text style={styles.itemTitulo}>{q.name}</Text>
                <Text style={styles.itemTexto}>{q.email}</Text>
                <Text style={styles.mensagem}>{q.message}</Text>
                <Pressable style={styles.botaoSecundario} onPress={() => resolverPergunta(q.id)}>
                  <Text style={styles.botaoSecundarioTexto}>Marcar como resolvida</Text>
                </Pressable>
              </View>
            ))
          )}
        </Secao>
      </ScrollView>
    </SafeAreaView>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View style={styles.secao}>
      <Text style={styles.secaoTitulo}>{titulo}</Text>
      {children}
    </View>
  );
}

function Campo(props: any) {
  return (
    <TextInput
      {...props}
      style={[styles.input, props.multiline && styles.textarea]}
      textAlignVertical={props.multiline ? 'top' : 'center'}
    />
  );
}

function Botao({ texto, onPress }: { texto: string; onPress: () => void }) {
  return (
    <Pressable style={styles.botao} onPress={onPress}>
      <Text style={styles.botaoTexto}>{texto}</Text>
    </Pressable>
  );
}

function formatarData(valor: string) {
  const data = valor.length === 10 ? new Date(`${valor}T12:00:00`) : new Date(valor);
  return data.toLocaleDateString('pt-BR');
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingBottom: 50 },
  voltar: { color: '#4f46e5', fontWeight: '600', marginBottom: 18 },
  titulo: { fontSize: 28, fontWeight: 'bold', color: '#0f172a' },
  subtitulo: { color: '#64748b', marginTop: 5, marginBottom: 20 },
  secao: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 18, borderWidth: 1, borderColor: '#e2e8f0' },
  secaoTitulo: { fontSize: 19, fontWeight: 'bold', color: '#0f172a', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 12, marginBottom: 10, backgroundColor: '#fff' },
  textarea: { minHeight: 100 },
  botao: { backgroundColor: '#4f46e5', padding: 13, borderRadius: 10, marginTop: 4 },
  botaoTexto: { color: '#fff', textAlign: 'center', fontWeight: '700' },
  itemPainel: { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 12, marginTop: 12 },
  itemTitulo: { fontWeight: 'bold', color: '#0f172a' },
  itemTexto: { color: '#64748b', marginTop: 3 },
  mensagem: { color: '#334155', marginTop: 8, lineHeight: 20 },
  botaoSecundario: { alignSelf: 'flex-start', backgroundColor: '#e0e7ff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9, marginTop: 10 },
  botaoSecundarioTexto: { color: '#4338ca', fontWeight: '700' },
  vazio: { color: '#64748b' },
});
