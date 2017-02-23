# PROGETTO SDCC
##**Your Own Distributed System using Consensus Protocols**

##Requisiti del progetto
Lo scopo del progetto è realizzare, in un linguaggio di programmazione a scelta, un sistema distribuito che
usi protocolli di consenso utilizzando i servizi Cloud messi a disposizione da AWS Educate, Google o altro
provider (inclusa una piattaforma di Cloud privata, gestita ad esempio con OpenStack).
Il sistema distribuito da realizzare è a scelta del gruppo di studenti. 

##Esempi possibili includono:
- un gioco multi-player;
- una chat room distribuita e tollerante a guasti, in cui l’ordine dei messaggi scambiati tra molteplici
partecipanti alla chat sia lo stesso.

##Il sistema distribuito proposto deve soddisfare i requisiti funzionali e non funzionali elencati di seguito.
- *Supportare molteplici entità autonome che si contendono risorse condivise*.
- *Supportare l’aggiornamento in tempo reale di una qualche forma di stato condiviso*.
- *Essere distribuito su molteplici nodi (eventualmente distribuiti geograficamente)*.
- *Non fare affidamento su entità centralizzate per funzionalità essenziali*; (i soli servizi centralizza- 
ti consentiti riguardano la registrazione e l’accesso degli utenti al sistema e simili funzionalità di gestione.)
- *Supportare la scalabilità (rispetto al numero di utenti) e l’affidabilità e disponibilità*. Per soddisfare 
quest’ultimo requisito occorre adottare opportune tecniche di replicazione della computazione/ dei dati
su molteplici nodi del sistema. Si descriva nella relazione quale tipo di scalabilità (rispetto alla
dimensione, geografica) viene soddisfatta dal sistema realizzato, motivando opportunamente la scelta
e le soluzioni adottate; si descrivano inoltre quali soluzioni sono state adottate per garantire un’elevata
affidabilità/disponibilità.
- *Usare un protocollo di consenso distribuito per mantenere uno stato condiviso consistente tra le moltiplici
repliche, ovvero l’algoritmo di Paxos esaminato a lezione o sue varianti* (ad es. Fast Paxos),
*oppure altri protocolli di consenso proposti recentemente, in particolare Raft*.

- *Utilizzare almeno un servizio Cloud, eventualmente usufruendo del grant fornito da AWS Educate*.
Si progetti il sistema distribuito ponendo particolare cura al soddisfacimento dei requisiti sopra elencati
e delle altre eventuali scelte effettuate dal gruppo. I componenti del sistema distribuito devono essere eseguibili
nello spazio utente e senza richiedere privilegi di root. Si richiede inoltre che il sistema distribuito sia
configurabile, ad es. tramite un file in cui sia possibile specificare i valori dei parametri di configurazione
(tra cui, numero iniziale di repliche).
Si realizzi un testing completo delle funzionalita offerte e dei diversi casi d’uso del sistema distribuito realizzato, presentandone i risultati nella relazione.
E' possibile usare librerie e tool di supporto allo sviluppo del progetto; le librerie ed i tool usati devono essere esplicitamente indicati e brevemente descritti nella relazione.

