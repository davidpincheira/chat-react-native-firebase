// @refresh reset
//import { StatusBar } from 'expo-status-bar'
import React, { useState, useEffect, useCallback } from 'react'
import { GiftedChat }  from 'react-native-gifted-chat'
import { StyleSheet, Text, View, TextInput, Button, LogBox } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import firebase from 'firebase/app'
import 'firebase/firestore'

const firebaseConfig = {
  
};

if(!firebase.apps.length){
  firebase.initializeApp(firebaseConfig);
}

LogBox.ignoreLogs(['Setting a timer for a long period of time'])

const db = firebase.firestore()
const chatsRef = db.collection('chats')

export default function App() {
  const [user, setUser] = useState(null)
  const [name, setName] = useState('')
  const [messages, setMessages] = useState([])

  useEffect(() => {
    //funciona como listener
    readUser()
    const unsubscribe = chatsRef.onSnapshot((querySnapshot) => {
      const messagesFirestore = querySnapshot
        .docChanges()
        .filter(({type})=> type == 'added')
        .map(({doc})=> {
          const message = doc.data()
          return {...message, createdAt: message.createdAt.toDate()}  
        })
        .sort((a, b) => b.createdAt.getTime() - a)
      appendMessages(messagesFirestore)
    })
    return () => unsubscribe()
  }, [])

  const readUser = async () => {
    const user = await AsyncStorage.getItem('user')

    if (user) {
      setUser(JSON.parse(user))
    }
  }

  const handlePress = async () => {
    const _id = Math.random().toString(36).substring(7)
    const user = { _id, name }
    await AsyncStorage.setItem('user', JSON.stringify(user))
    setUser(user)
  }

  const appendMessages = useCallback(
    (messages) => {
      setMessages((previousMessages) => GiftedChat.append(previousMessages, messages))
    },
    [messages],
  )

  const handleSend = async (messages) => {
    const writes = messages.map( m => chatsRef.add(m))
    await Promise.all(writes)
  }

  if(!user){
    return (<View style={styles.container}>
              <TextInput style={styles.input} placeholder='Enter your name' value={name} onChangeText={setName} />
              <Button onPress={handlePress} title='enter the chat' />
            </View>)
  }

  return <GiftedChat messages={messages} user={user} onSend={handleSend} />
  
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    height: 50,
    width: '100%',
    borderWidth: 1,
    padding: 15,
    borderColor: 'gray',
    marginBottom: 20
  }
});
