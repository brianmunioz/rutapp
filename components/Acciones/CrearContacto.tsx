import { MapMarker } from 'expo-leaflet';
import React, { useEffect, useState } from 'react'
import { View, Text } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import IDatosContacto from '@/interfaces/IDatosContacto';
import { Button, HelperText, Icon, RadioButton, Snackbar,TextInput } from 'react-native-paper';
import verificarTexto from '@/helpers/verificarTexto';


interface IProps {
  setModalVisible: (bool: boolean) => void,
  ubicacionSeleccionada: MapMarker[],
  resetTodo: () => void

}

const CrearContacto: React.FC<IProps> = ({setModalVisible,ubicacionSeleccionada,resetTodo}) => {
  const [mensaje,setMensaje] = useState({bool:false, texto:"",error:true});

  const [data, setData] = useState<IDatosContacto>({ nombre: "", tipo: "cliente", direccion: "", telefono: "", nota: "", lat: 0, lng: 0,area:"" });
  const db = useSQLiteContext();
 
const crear = async()=>{
  if(!data.nombre || !data.direccion){
    setMensaje({bool: true, texto: "Nombre y dirección son obligatorios para poder crear un contacto nuevo",error:true})
  }else if((!data.area && data.telefono) || (!data.telefono && data.area)){
    setMensaje({bool: true,texto:"Área y teléfono deben ser completados ambos para poder guardar número de teléfono",error:true})
  }else if (!verificarTexto(data.nombre)) {
    setMensaje({ bool: true, texto: `El campo NOMBRE contiene caracteres inválidos. Asegúrate de usar únicamente letras, números y los siguientes caracteres: $%,.-!?¿¡:;"'()`, error: true })

  }else if (!verificarTexto(data.direccion)) {
    setMensaje({ bool: true, texto: `El campo DIRECCIÓN contiene caracteres inválidos. Asegúrate de usar únicamente letras, números y los siguientes caracteres: $%,.-!?¿¡:;"'()`, error: true })

  }
  
  else if (!verificarTexto(data.nota) && data.nota) {
    setMensaje({ bool: true, texto: `El campo NOTA contiene caracteres inválidos. Asegúrate de usar únicamente letras, números y los siguientes caracteres: $%,.-!?¿¡:;"'()`, error: true })

  }
  
  else{
const telefono = data.area && data.telefono ? data.area +""+ data.telefono :null;

    await db.runAsync('INSERT INTO contactos (nombre,direccion,telefono,tipo,notas,lat,lng) VALUES (?,?,?,?,?,?,?)', data.nombre, data.direccion,telefono != null ? parseInt(telefono): null,data.tipo,data.nota, ubicacionSeleccionada[0].position.lat,ubicacionSeleccionada[0].position.lng);

      setMensaje({bool: true,texto:"Contacto creado con éxito, en breve se dirigirá a la vista de contactos",error:false})
      setTimeout(()=>{
        resetTodo()
      },2000)

  }
}
  return (
    <View style={{width: "100%", paddingHorizontal: 20, paddingTop: 10, flex: 1, backgroundColor: "white", gap: 10}}>
      {/* comments */}
      <Button style={{alignSelf: "flex-start"}} onPress={()=>setModalVisible(false)}>Volver</Button>
      <TextInput 
        label="Nombre"
        value={data.nombre}
        mode="outlined"
        activeOutlineColor='#000'
        onChangeText={text => setData({ ...data, nombre: text })}  />
         <TextInput 
        label="Dirección"
        value={data.direccion}
        mode="outlined"
        activeOutlineColor='#000'
        onChangeText={text => setData({ ...data, direccion: text })} />
         
        <View style={{display: "flex",justifyContent: "flex-start",flexDirection: "row", gap:5}}>
        <TextInput 
        label="Código de área"
        value={data.area}
        keyboardType='numeric'

        mode="outlined"
        activeOutlineColor='#000'
        style={{width:"30%"}}
        onChangeText={text => setData({ ...data, area: text })} />
         <TextInput 
        label="Número de teléfono"
        keyboardType='numeric'
        value={data.telefono}
        mode="outlined"
        style={{width:"70%"}}
        activeOutlineColor='#000'
        onChangeText={text => setData({ ...data, telefono: text })} />
        </View>
        <View>
        <HelperText type='info' visible={true}>
              Por favor, si ingresa un número de teléfono,ingrese su código de país. {"\n"}
              Ejemplos:{"\n"}
              - 54 para Argentina{"\n"}
              - 1 para Estados Unidos{"\n"}
              - 34 para España{"\n"}
              - 55 para Brasil{"\n"}
              - 52 para México{"\n"}
              Asegúrese de usar solo números.              </HelperText>
        <Text>Seleccione tipo de contacto:</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
        <RadioButton
        value="cliente"
        
        status={ data.tipo === 'cliente' ? 'checked' : 'unchecked' }
        onPress={() => setData({...data,tipo:"cliente"})}
      />
                <Text><Icon color='green' size={20} source={'map-marker'}/>Cliente</Text>
        </View>


        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
        <RadioButton
        value="proveedor"
        
        status={ data.tipo === 'proveedor' ? 'checked' : 'unchecked' }
        onPress={() => setData({...data,tipo:"proveedor"})}
      />
                <Text><Icon color='red' size={20} source={'map-marker'}/>Proveedor</Text>
        </View>
     
      
    </View> 
           <TextInput 
        label="Nota"
        value={data.nota}
        mode="outlined"
        activeOutlineColor='#000'
        onChangeText={text => setData({ ...data, nota: text })} />
        <Button mode='contained' onPress={crear}>Crear contacto</Button>
        <Snackbar style={{backgroundColor:mensaje.error ? "#740938" : "#386b38"}} rippleColor={"black"} visible={mensaje.bool} onDismiss={()=>setMensaje({...mensaje,bool:false})}>{mensaje.texto}</Snackbar>
    </View>
  )
}

export default CrearContacto