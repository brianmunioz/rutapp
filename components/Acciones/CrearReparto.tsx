import { MapMarker } from 'expo-leaflet';
import React, { Fragment, useEffect, useState } from 'react'
import { View, ScrollView } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Button, Card, Divider, Icon, Snackbar, Text, TextInput, TouchableRipple } from 'react-native-paper';
import IcontactosSQL from '@/interfaces/IContactosSQL';
import IRepartosSQL from '@/interfaces/IRepartosSQL';
import AsyncStorage from '@react-native-async-storage/async-storage';


interface IProps {
  setModalVisible: (bool: boolean) => void,
  contactos: IcontactosSQL[],
  ubicacionSeleccionada: MapMarker[],
  resetTodo: () => void,
  repartoConContacto?:boolean|null

}

const CrearReparto: React.FC<IProps> = ({ setModalVisible, ubicacionSeleccionada, resetTodo, contactos,repartoConContacto = null }) => {
  const [mensaje, setMensaje] = useState({ bool: false, texto: "", error: true });
  console.log(contactos.length)
  const [seleccionContacto, setSeleccionContacto] = useState<boolean|null>(contactos.length > 0 ? repartoConContacto : false);

  const [data, setData] = useState({ nombre: "", tipo: "cliente", direccion: "", telefono: "", descripcion: "", lat: 0, lng: 0, area: "",IDContacto:"",fecha:new Date(),finalizado:false });
  const db = useSQLiteContext();

  const crear = async () => {
    if (!data.nombre || !data.direccion) {
      setMensaje({ bool: true, texto: "Nombre y dirección son obligatorios para poder crear un contacto nuevo", error: true })
    } else {

      let telefono = data.area && data.telefono ? data.area + "" + data.telefono : null;
      let lat = seleccionContacto? data.lat: ubicacionSeleccionada[0].position.lat;
      let lng = seleccionContacto? data.lng: ubicacionSeleccionada[0].position.lng
      if(seleccionContacto){
        telefono=data.telefono;
      }
      const fecha = new Date().toISOString().slice(0, 19).replace('T', ' '); // Formato YYYY-MM-DD HH:MM:SS      //agregar 3 campos mas para que funcione
       const response = await db.runAsync('INSERT INTO repartos (nombre,direccion,telefono,tipo_contacto,descripcion,lat,lng,IDContacto,fecha,finalizado) VALUES (?,?,?,?,?,?,?,?,?,?)', data.nombre, data.direccion, 2915664567, data.tipo, data.descripcion, lat, lng,data.IDContacto,fecha,false);

       if (response && response?.lastInsertRowId) {
        const idsAsync = await AsyncStorage.getItem('ordenrepartos');

        let ids: number[] = idsAsync && idsAsync !== null ? JSON.parse(idsAsync) : [];
        ids.push(response.lastInsertRowId)
        await AsyncStorage.setItem('ordenrepartos',JSON.stringify(ids))
        setMensaje({ bool: true, texto: "Reparto creado con éxito, en breve se dirigirá a la vista de repartos", error: false })
      setTimeout(() => {
        resetTodo()
      }, 1500)
        console.log(`Registro creado con éxito. ID: ${response.lastInsertRowId}`);
      } else {
        console.log("Error al crear el registro o falta de confirmación.");
      }
      

    }
  }
  if(seleccionContacto === null){
    return <View style={{width:"100%",flex:1,justifyContent:'center',height:"100%",alignItems:"center",backgroundColor:"white"}}>
      {contactos.length > 0 && 
              <TouchableRipple  onPress={()=>{setSeleccionContacto(true)}} style={{borderRadius: 0, flex:1,width: "100%",justifyContent:"center", alignItems:"center",  backgroundColor: "#800000"}}><Text style={{fontWeight: 600, fontSize: 20,color:"#fff",letterSpacing: 2}} >Crear reparto con contacto</Text></TouchableRipple>

      }
        <TouchableRipple   onPress={()=>{
          
          setSeleccionContacto(false)
          setModalVisible(false)
          }} style={{borderRadius: 0, flex:1,width: "100%",justifyContent:"center", alignItems:"center",  backgroundColor: "#3795BD"}}><Text style={{fontWeight: 600, fontSize: 20,color:"#fff",letterSpacing: 2}}>Crear reparto de forma manual</Text></TouchableRipple>

    </View>
  }else{
  return (
    <View style={{ width: "100%", paddingHorizontal: 20, paddingTop: 10, flex: 1, backgroundColor: "white", gap: 10 }}>
      <Button icon={'arrow-left'}  style={{ alignSelf: "flex-start" }} onPress={() => setSeleccionContacto(null)}>Volver</Button>

     
      {
        !seleccionContacto &&
        <Fragment>
          <TextInput
            label="Nombre"
            value={data.nombre}
            mode="outlined"
            activeOutlineColor='#000'
            onChangeText={text => setData({ ...data, nombre: text })} />
          <TextInput
            label="Dirección"
            value={data.direccion}
            mode="outlined"
            activeOutlineColor='#000'
            onChangeText={text => setData({ ...data, direccion: text })} />

          <View style={{ display: "flex", justifyContent: "flex-start", flexDirection: "row", gap: 5 }}>
            <TextInput
              label="Código de país"
              value={data.area}
              keyboardType='numeric'

              mode="outlined"
              activeOutlineColor='#000'
              style={{ width: "30%" }}
              onChangeText={text => setData({ ...data, area: text })} />
            <TextInput
              label="Número de telefono"
              keyboardType='numeric'
              value={data.telefono}
              mode="outlined"
              style={{ width: "70%" }}
              activeOutlineColor='#000'
              onChangeText={text => setData({ ...data, telefono: text })} />
          </View>

        </Fragment>
      }

      {
        seleccionContacto &&
        <ScrollView style={{ flex: 1 }}>
          {contactos.length > 0 && !data.IDContacto && contactos.map((e) => <Card.Title title={e.nombre}
          key={e.id}
            subtitle={e.direccion}
            right={() => <Button mode="elevated" onPress={()=>{              
              setData({...data,nombre: e.nombre,IDContacto:e.id.toString(),lng:e.lng,lat:e.lat,direccion:e.direccion, telefono: e.telefono.toString(),tipo:e.tipo})
            }}>seleccionar</Button>}
            left={(props) => <Icon {...props} source="map-marker" color={e.tipo === "proveedor" ? 'green' : 'red'} />}
          />)}
          {contactos.length > 0 && data.IDContacto && 
          <Card>
            <Card.Title title={data.nombre}
          key={data.IDContacto}
            subtitle={data.direccion}
            right={() => <Button mode="elevated" onPress={()=>{              
              setData({...data,nombre:"",IDContacto:"",lng:0,lat:0,direccion:'', telefono: ''})
            }}>quitar seleccion</Button>}
            left={(props) => <Icon {...props} source="map-marker" color={data.tipo === "proveedor" ? 'green' : 'red'} />}
          />

          </Card>
          }
          
        </ScrollView>
      }
      <Divider style={{ marginTop: 10 }}></Divider>
      <TextInput
        label="Descripción"
        value={data.descripcion}
        mode="outlined"
        activeOutlineColor='#000'
        onChangeText={text => setData({ ...data, descripcion: text })} />
      <Button mode='contained' onPress={crear}>Crear reparto</Button>

      <Snackbar style={{ backgroundColor: mensaje.error ? "#ff3a30" : "#386b38" }} rippleColor={"black"} visible={mensaje.bool} onDismiss={() => setMensaje({ ...mensaje, bool: false })}>{mensaje.texto}</Snackbar>
    </View>
  )
}
}

export default CrearReparto