import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../lib/supabase';

type Book = {
  id: number;
  title: string;
  author: string;
  description: string | null;
  total_copies: number;
  available_copies: number;
  active: boolean;
};

export default function BibliotecaScreen({ voltar }: { voltar: () => void }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [solicitandoId, setSolicitandoId] = useState<number | null>(null);

  useEffect(() => {
    carregarLivros();
  }, []);

  async function carregarLivros() {
    setCarregando(true);
    const { data, error } = await supabase
      .from('books')
      .select('id, title, author, description, total_copies, available_copies, active')
      .eq('active', true)
      .order('title');

    if (error) {
      console.log(error);
      Alert.alert('Erro', 'Não foi possível carregar os livros.');
    } else {
      setBooks((data || []) as Book[]);
    }
    setCarregando(false);
  }

  async function solicitarEmprestimo(book: Book) {
    if (book.available_copies <= 0) return;

    try {
      setSolicitandoId(book.id);
      const { data, error } = await supabase.rpc('request_book_loan', {
        p_book_id: book.id,
      });

      if (error) {
        Alert.alert('Não foi possível solicitar', error.message);
        return;
      }

      const loan: any = Array.isArray(data) ? data[0] : data;
      Alert.alert(
        'Empréstimo solicitado!',
        `Livro: ${book.title}\nVoucher: ${loan?.code || ''}\nPrazo: ${formatarData(loan?.due_date)}\n\nApresente o voucher na biblioteca para retirar o livro.`
      );

      await carregarLivros();
    } finally {
      setSolicitandoId(null);
    }
  }

  const filtrados = books.filter((book) => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return true;
    return (
      book.title.toLowerCase().includes(termo) ||
      book.author.toLowerCase().includes(termo) ||
      (book.description || '').toLowerCase().includes(termo)
    );
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={voltar}><Text style={styles.voltar}>← Voltar</Text></Pressable>
        <Text style={styles.titulo}>Biblioteca</Text>
        <Text style={styles.subtitulo}>Consulte o acervo e solicite empréstimos.</Text>
        <TextInput
          style={styles.busca}
          placeholder="Buscar por título, autor ou descrição"
          value={busca}
          onChangeText={setBusca}
        />
      </View>

      {carregando ? (
        <View style={styles.centralizado}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <FlatList
          data={filtrados}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.lista}
          refreshing={carregando}
          onRefresh={carregarLivros}
          ListEmptyComponent={<Text style={styles.vazio}>Nenhum livro encontrado.</Text>}
          renderItem={({ item }) => {
            const disponivel = item.available_copies > 0;
            return (
              <View style={styles.card}>
                <Text style={styles.cardTitulo}>{item.title}</Text>
                <Text style={styles.autor}>Por {item.author}</Text>
                {!!item.description && <Text style={styles.descricao}>{item.description}</Text>}
                <Text style={[styles.disponibilidade, !disponivel && styles.indisponivel]}>
                  {item.available_copies} de {item.total_copies} exemplar(es) disponível(is)
                </Text>
                <Pressable
                  style={[styles.botao, !disponivel && styles.botaoDesativado]}
                  disabled={!disponivel || solicitandoId === item.id}
                  onPress={() => solicitarEmprestimo(item)}
                >
                  <Text style={styles.botaoTexto}>
                    {solicitandoId === item.id
                      ? 'Solicitando...'
                      : disponivel
                        ? 'Solicitar empréstimo'
                        : 'Sem exemplares disponíveis'}
                  </Text>
                </Pressable>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

function formatarData(valor?: string | null) {
  if (!valor) return '-';
  const data = valor.length === 10 ? new Date(`${valor}T12:00:00`) : new Date(valor);
  return data.toLocaleDateString('pt-BR');
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, paddingBottom: 10 },
  voltar: { color: '#4f46e5', fontWeight: '600', marginBottom: 18 },
  titulo: { fontSize: 28, fontWeight: 'bold', color: '#0f172a' },
  subtitulo: { color: '#64748b', marginTop: 5, marginBottom: 14 },
  busca: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1',
    borderRadius: 12, padding: 13,
  },
  lista: { padding: 20, paddingTop: 10, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff', padding: 18, borderRadius: 16, marginBottom: 14,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  cardTitulo: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  autor: { color: '#4f46e5', marginTop: 4, fontWeight: '600' },
  descricao: { color: '#64748b', marginTop: 10, lineHeight: 20 },
  disponibilidade: { color: '#059669', marginTop: 12, fontWeight: '600' },
  indisponivel: { color: '#dc2626' },
  botao: { backgroundColor: '#0f172a', padding: 13, borderRadius: 10, marginTop: 14 },
  botaoDesativado: { opacity: 0.45 },
  botaoTexto: { color: '#fff', textAlign: 'center', fontWeight: '700' },
  centralizado: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  vazio: { textAlign: 'center', color: '#64748b', marginTop: 40 },
});
