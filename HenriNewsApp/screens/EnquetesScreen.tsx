import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../lib/supabase';

type Option = { id: number; label: string; option_text: string };
type Poll = { id: number; question: string; active: boolean; created_at: string; poll_options: Option[] };

export default function EnquetesScreen({ voltar }: { voltar: () => void }) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [myVotes, setMyVotes] = useState<Record<number, number>>({});
  const [votesByOption, setVotesByOption] = useState<Record<number, number>>({});
  const [carregando, setCarregando] = useState(true);
  const [votando, setVotando] = useState<number | null>(null);

  useEffect(() => { carregarTudo(); }, []);

  async function carregarTudo() {
    setCarregando(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { data: pollsData, error: pollsError } = await supabase
      .from('polls')
      .select('id, question, active, created_at, poll_options(id, label, option_text)')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (pollsError) console.log(pollsError);
    else {
      const normalizados = ((pollsData || []) as any[]).map((poll) => ({
        ...poll,
        poll_options: [...(poll.poll_options || [])].sort((a, b) => a.label.localeCompare(b.label)),
      }));
      setPolls(normalizados as Poll[]);
    }

    if (user) {
      const { data } = await supabase
        .from('poll_votes')
        .select('poll_id, option_id')
        .eq('user_id', user.id);

      const mapa: Record<number, number> = {};
      (data || []).forEach((vote: any) => { mapa[vote.poll_id] = vote.option_id; });
      setMyVotes(mapa);
    }

    const { data: resultados, error: resultError } = await supabase.rpc('get_poll_results');
    if (resultError) console.log(resultError);
    else {
      const mapa: Record<number, number> = {};
      (resultados || []).forEach((item: any) => { mapa[item.option_id] = Number(item.votes || 0); });
      setVotesByOption(mapa);
    }

    setCarregando(false);
  }

  async function votar(pollId: number, optionId: number) {
    if (myVotes[pollId]) {
      Alert.alert('Enquete', 'Você já votou nesta enquete.');
      return;
    }

    setVotando(optionId);
    const { error } = await supabase.rpc('vote_poll', {
      p_poll_id: pollId,
      p_option_id: optionId,
    });
    setVotando(null);

    if (error) {
      Alert.alert('Não foi possível votar', error.message);
      return;
    }

    await carregarTudo();
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={voltar}><Text style={styles.voltar}>← Voltar</Text></Pressable>
        <Text style={styles.titulo}>Enquetes</Text>
        <Text style={styles.subtitulo}>Participe das decisões da comunidade escolar.</Text>

        {carregando ? (
          <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 40 }} />
        ) : polls.length === 0 ? (
          <Text style={styles.vazio}>Nenhuma enquete ativa.</Text>
        ) : (
          polls.map((poll) => {
            const total = poll.poll_options.reduce((soma, op) => soma + (votesByOption[op.id] || 0), 0);
            const jaVotou = !!myVotes[poll.id];

            return (
              <View key={poll.id} style={styles.card}>
                <Text style={styles.pergunta}>{poll.question}</Text>
                {jaVotou && <Text style={styles.jaVotou}>Seu voto já foi registrado.</Text>}

                {poll.poll_options.map((op) => {
                  const votos = votesByOption[op.id] || 0;
                  const percentual = total ? Math.round((votos / total) * 100) : 0;
                  const selecionada = myVotes[poll.id] === op.id;

                  return (
                    <View key={op.id} style={styles.opcaoBloco}>
                      <Pressable
                        style={[styles.opcao, selecionada && styles.opcaoSelecionada, jaVotou && !selecionada && styles.opcaoBloqueada]}
                        disabled={jaVotou || votando !== null}
                        onPress={() => votar(poll.id, op.id)}
                      >
                        <Text style={[styles.opcaoTexto, selecionada && styles.opcaoTextoSelecionada]}>
                          {op.label}: {op.option_text}
                        </Text>
                        <Text style={[styles.votos, selecionada && styles.opcaoTextoSelecionada]}>
                          {votando === op.id ? '...' : `${votos} voto(s)`}
                        </Text>
                      </Pressable>
                      <View style={styles.barraFundo}>
                        <View style={[styles.barra, { width: `${percentual}%` }]} />
                      </View>
                      <Text style={styles.percentual}>{percentual}%</Text>
                    </View>
                  );
                })}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingBottom: 40 },
  voltar: { color: '#4f46e5', fontWeight: '600', marginBottom: 18 },
  titulo: { fontSize: 28, fontWeight: 'bold', color: '#0f172a' },
  subtitulo: { color: '#64748b', marginTop: 5, marginBottom: 20 },
  card: { backgroundColor: '#fff', padding: 18, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 18 },
  pergunta: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 },
  jaVotou: { color: '#059669', fontSize: 13, marginBottom: 12 },
  opcaoBloco: { marginTop: 10 },
  opcao: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, padding: 13, flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  opcaoSelecionada: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  opcaoBloqueada: { opacity: 0.65 },
  opcaoTexto: { flex: 1, color: '#334155', fontWeight: '600' },
  opcaoTextoSelecionada: { color: '#fff' },
  votos: { color: '#64748b', fontSize: 12 },
  barraFundo: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 99, overflow: 'hidden', marginTop: 7 },
  barra: { height: 6, backgroundColor: '#4f46e5' },
  percentual: { textAlign: 'right', color: '#94a3b8', fontSize: 11, marginTop: 3 },
  vazio: { textAlign: 'center', color: '#64748b', marginTop: 40 },
});
