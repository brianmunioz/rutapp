import { Button, CheckIcon, FormControl, Input, Modal, Select } from 'native-base';
import { MapMarker } from 'expo-leaflet';
import React, { useRef, useState } from 'react'
import { Alert } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

interface IProps {
  modalVisible: boolean;
  setModalVisible: (bool: boolean) => void;
  ubicacionSeleccionada: MapMarker[],
  resetTodo : ()=>void
}

const CrearContacto: React.FC<IProps> = ({ modalVisible, setModalVisible, ubicacionSeleccionada, resetTodo }) => {
  const initialRef = useRef(null);
  const db = useSQLiteContext();
  const finalRef = useRef(null);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [notas, setNotas] = useState('');

  const [tipo, setTipo] = useState('proveedor');
  return (
    <Modal isOpen={modalVisible} onClose={() => setModalVisible(false)} initialFocusRef={initialRef} finalFocusRef={finalRef}>
      <Modal.Content>
        <Modal.CloseButton />
        <Modal.Header>Guardar contacto</Modal.Header>
        <Modal.Body>
          <FormControl isRequired isInvalid={!nombre || nombre.length <= 3 ? true : false}>
            <FormControl.Label >Nombre</FormControl.Label>
            <Input ref={initialRef} value={nombre} onChangeText={(e) => setNombre(e)} />
            <FormControl.ErrorMessage>
              Debe ingresar un nombre válido
            </FormControl.ErrorMessage>
          </FormControl>
          <FormControl isInvalid={!direccion || direccion.length < 4 ? true : false} isRequired mt="3">
            <FormControl.Label>Dirección</FormControl.Label>
            <Input value={direccion} onChangeText={(e) => setDireccion(e)} />
            <FormControl.ErrorMessage>
              Debe ingresar una dirección válida
            </FormControl.ErrorMessage>
          </FormControl>
          <FormControl mt="3">
            <FormControl.Label >Telefono</FormControl.Label>
            <Input keyboardType="numeric" value={telefono} onChangeText={(e) => setTelefono(e)} />
          </FormControl>
          <FormControl mt="3">
            <FormControl.Label>Notas</FormControl.Label>
            <Input value={notas} onChangeText={(e) => setNotas(e)} />
          </FormControl>
          <FormControl isReadOnly>
            <FormControl.Label>Seleccione tipo de contacto</FormControl.Label>
            <Select
              accessibilityLabel="Proveedor"
              placeholder="Seleccione tipo de contacto"
              _selectedItem={{
                bg: "teal.600",
                endIcon: <CheckIcon size={5}
                />,
              }}
              mt="1"
              defaultValue={tipo}
              onValueChange={(e) => setTipo(e)}


            >
              <Select.Item label="Proveedor" value="proveedor" />
              <Select.Item label="Cliente" value="cliente" />
            </Select>

          </FormControl>

        </Modal.Body>
        <Modal.Footer>
          <Button.Group space={2}>
            <Button variant="ghost" colorScheme="blueGray" onPress={() => {
              setModalVisible(false);
              
            }}>
              Cancelar
            </Button>
            <Button
              backgroundColor={"green.800"}
              onPress={async () => {
                if (ubicacionSeleccionada.length == 0) {
                  Alert.alert("no seleccionó una ubicación")
                } else {                  
                   await db.runAsync("INSERT INTO contactos (nombre, direccion,lat,lng,telefono, notas,tipo) VALUES (?,?,?,?,?,?,?)", nombre, direccion, ubicacionSeleccionada[0].position.lat, ubicacionSeleccionada[0].position.lng, telefono, notas, tipo)
                   setModalVisible(false);
                   setNombre("");
                   setDireccion("");
                   setNotas("");
                   setTipo("proveedor");
                   setTelefono("");                                      
                   resetTodo();                  
                  Alert.alert(nombre+" se agregó a tu lista de contactos como "+tipo);
                }
              }}>
              Guardar contacto
            </Button>
          </Button.Group>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  )
}

export default CrearContacto