import PropTypes from 'prop-types'
import { Handle, Position, useUpdateNodeInternals } from 'reactflow'
import { useEffect, useRef, useState, useContext } from 'react'
import { useSelector } from 'react-redux'

// material-ui
import { useTheme, styled } from '@mui/material/styles'
import { Box, Typography, Tooltip, IconButton, Button } from '@mui/material'
import { tooltipClasses } from '@mui/material/Tooltip'
import { IconArrowsMaximize, IconEdit, IconAlertTriangle } from '@tabler/icons'

// project import
import { Dropdown } from 'ui-component/dropdown/Dropdown'
import { MultiDropdown } from 'ui-component/dropdown/MultiDropdown'
import { AsyncDropdown } from 'ui-component/dropdown/AsyncDropdown'
import { Input } from 'ui-component/input/Input'
import { DataGrid } from 'ui-component/grid/DataGrid'
import { File } from 'ui-component/file/File'
import { SwitchInput } from 'ui-component/switch/Switch'
import { flowContext } from 'store/context/ReactFlowContext'
import { isValidConnection } from 'utils/genericHelper'
import { JsonEditorInput } from 'ui-component/json/JsonEditor'
import { TooltipWithParser } from 'ui-component/tooltip/TooltipWithParser'
import ToolDialog from 'views/tools/ToolDialog'
import AssistantDialog from 'views/assistants/AssistantDialog'
import FormatPromptValuesDialog from 'ui-component/dialog/FormatPromptValuesDialog'
import CredentialInputHandler from './CredentialInputHandler'

// utils
import { getInputVariables } from 'utils/genericHelper'

// const
import { FLOWISE_CREDENTIAL_ID } from 'store/constant'

const EDITABLE_OPTIONS = ['selectedTool', 'selectedAssistant']

const CustomWidthTooltip = styled(({ className, ...props }) => <Tooltip {...props} classes={{ popper: className }} />)({
    [`& .${tooltipClasses.tooltip}`]: {
        maxWidth: 500
    }
})

// ===========================|| NodeInputHandler ||=========================== //
const translateInputParamsAnchors = {
    'Language Model': 'Языковая Модель',
    'Base Id': 'ID по умолчанию',
    'Base URL': 'URL по умолчанию',
    Size: 'Размер',
    Embeddings: 'Вложения',
    'Auto Summary': 'Автоматическое резюме',
    'Table Id': 'ID таблицы',
    'Connect Credential': 'Подключить учетные данные',
    'Allowed Tools': 'Доступные инструменты',
    'Vector Store Retriever': 'Векторный магазин Ретривер',
    'Chat Model': 'Чат модель',
    'AutoGPT Name': 'Имя AutoGPT',
    'AutoGPT Role': 'Роль AutoGPT',
    'Maximum Loop': 'Максимум циклов',
    'Select Assistant': 'Выбор Ассистента',
    'Base Path': 'Базовый путь',
    'Example Prompt': 'Пример запроса',
    Cache: 'Кэш',
    Memory: 'Память',
    'Base Chain': 'Базовая цепочка',
    'Chain Name': 'Имя цепочки',
    'System Message': 'Системное сообщение',
    'Memory Key': 'Ключ памяти',
    'API Documentation': 'Документация по API',
    'Task Loop': 'Цикл задачи',
    'Chunk Size': 'Размер фрагмента',
    'Return Source Documents': 'Вернуть исходные документы',
    Document: 'Документ',
    'Text Splitter': 'Разделитель текста',
    URL: 'URL',
    Template: 'Шаблон',
    'Base Path to store': 'Базовый путь для хранения',
    'Txt File': 'TXT-файл',
    Metadata: 'Метаданные',
    Usage: 'Использование',
    'Chunk Overlap': 'Перекрытие фрагментов',
    'Custom Separators': 'Пользовательские разделители',
    'Pdf File': 'PDF-файл',
    'Format Prompt Values': 'Форматирование значений запроса',
    Temperature: 'Температура',
    'Max Tokens': 'Максимальное количество токенов',
    'Top Probability': 'Вероятность верхних результатов',
    'Frequency Penalty': 'Штраф за частоту',
    'Presence Penalty': 'Штраф за наличие',
    Timeout: 'Таймаут',
    BasePath: 'Базовый путь',
    'ChatOpenAI Model': 'Модель ChatGPT OpenAI',
    Headers: 'Заголовки',
    'URL Prompt': 'URL-запрос',
    'Answer Prompt': 'Запрос на ответ',
    'Pinecone Index': 'Индекс Pinecone',
    'Pinecone Namespace': 'Пространство имен Pinecone',
    'Pinecone Metadata Filter': 'Фильтр метаданных Pinecone',
    'Strip New Lines': 'Удалить новые строки',
    'Batch Size': 'Размер пакета',
    Body: 'Тело',
    Description: 'Описание',
    'Plugin Url': 'URL плагина',
    'Use Legacy Build': 'Использовать предыдущую сборку',
    'Repo Link': 'Ссылка на репозиторий',
    Branch: 'Ветка',
    'Max Concurrency': 'Максимальная параллельность',
    Recursive: 'Рекурсивно',
    'Ignore Paths': 'Игнорировать пути',
    'Max Retries': 'Максимальное количество повторов',
    'Output Parser': 'Парсер вывода',
    'Prompt System Message': 'Системное сообщение запроса',
    'Prompt Description': 'Описание запроса',
    'Retriever Name': 'Имя извлекателя',
    'Retriever Description': 'Описание извлекателя',
    'Vector Store': 'Векторное хранилище',
    'Collection Name': 'Имя коллекции',
    'Chroma URL': 'URL Chroma',
    'Minimum Score (%)': 'Минимальный балл (%)',
    Query: 'Запрос',
    Database: 'База данных',
    Autofix: 'Автопоправка',
    'JSON Structure': 'Структура JSON',
    'Human Message': 'Сообщение для человека',
    File: 'Файл',
    'Sentences Before': 'Предложения перед',
    'Sentences After': 'Предложения после',
    Lambda: 'Лямбда',
    'Input Key': 'Ключ ввода',
    'Chain Option': 'Опция цепочки',
    'Get Relative Links Method': 'Метод получения относительных ссылок',
    'Model Name': 'Имя модели',
    'Chain Description': 'Описание цепочки'
}
const NodeInputHandler = ({ inputAnchor, inputParam, data, disabled = false, isAdditionalParams = false }) => {
    const theme = useTheme()
    const customization = useSelector((state) => state.customization)
    const ref = useRef(null)
    const { reactFlowInstance } = useContext(flowContext)
    const updateNodeInternals = useUpdateNodeInternals()
    const [position, setPosition] = useState(0)
    const [showExpandDialog, setShowExpandDialog] = useState(false)
    const [expandDialogProps, setExpandDialogProps] = useState({})
    const [showAsyncOptionDialog, setAsyncOptionEditDialog] = useState('')
    const [asyncOptionEditDialogProps, setAsyncOptionEditDialogProps] = useState({})
    const [reloadTimestamp, setReloadTimestamp] = useState(Date.now().toString())
    const [showFormatPromptValuesDialog, setShowFormatPromptValuesDialog] = useState(false)
    const [formatPromptValuesDialogProps, setFormatPromptValuesDialogProps] = useState({})

    const onExpandDialogClicked = (value, inputParam) => {
        const dialogProp = {
            value,
            inputParam,
            disabled,
            confirmButtonName: 'Сохранить',
            cancelButtonName: 'Отмена'
        }
        setExpandDialogProps(dialogProp)
        setShowExpandDialog(true)
    }

    const onFormatPromptValuesClicked = (value, inputParam) => {
        // Preset values if the field is format prompt values
        let inputValue = value
        if (inputParam.name === 'promptValues' && !value) {
            const obj = {}
            const templateValue =
                (data.inputs['template'] ?? '') + (data.inputs['systemMessagePrompt'] ?? '') + (data.inputs['humanMessagePrompt'] ?? '')
            const inputVariables = getInputVariables(templateValue)
            for (const inputVariable of inputVariables) {
                obj[inputVariable] = ''
            }
            if (Object.keys(obj).length) inputValue = JSON.stringify(obj)
        }
        const dialogProp = {
            value: inputValue,
            inputParam,
            nodes: reactFlowInstance.getNodes(),
            edges: reactFlowInstance.getEdges(),
            nodeId: data.id
        }
        setFormatPromptValuesDialogProps(dialogProp)
        setShowFormatPromptValuesDialog(true)
    }

    const onExpandDialogSave = (newValue, inputParamName) => {
        setShowExpandDialog(false)
        data.inputs[inputParamName] = newValue
    }

    const editAsyncOption = (inputParamName, inputValue) => {
        if (inputParamName === 'selectedTool') {
            setAsyncOptionEditDialogProps({
                title: 'Изменить инструмент',
                type: 'EDIT',
                confirmButtonName: 'Сохранить',
                cancelButtonName: 'Отмена',
                toolId: inputValue
            })
        } else if (inputParamName === 'selectedAssistant') {
            setAsyncOptionEditDialogProps({
                title: 'Изменить ассистента',
                type: 'EDIT',
                confirmButtonName: 'Сохранить',
                cancelButtonName: 'Отмена',
                assistantId: inputValue
            })
        }
        setAsyncOptionEditDialog(inputParamName)
    }

    const addAsyncOption = (inputParamName) => {
        if (inputParamName === 'selectedTool') {
            setAsyncOptionEditDialogProps({
                title: 'Добавить новый инструмент',
                type: 'ADD',
                confirmButtonName: 'Добавить',
                cancelButtonName: 'Отмена'
            })
        } else if (inputParamName === 'selectedAssistant') {
            setAsyncOptionEditDialogProps({
                title: 'Добавить нового ассистента',
                type: 'ADD',
                confirmButtonName: 'Добавить',
                cancelButtonName: 'Отмена'
            })
        }
        setAsyncOptionEditDialog(inputParamName)
    }

    const onConfirmAsyncOption = (selectedOptionId = '') => {
        if (!selectedOptionId) {
            data.inputs[showAsyncOptionDialog] = ''
        } else {
            data.inputs[showAsyncOptionDialog] = selectedOptionId
            setReloadTimestamp(Date.now().toString())
        }
        setAsyncOptionEditDialogProps({})
        setAsyncOptionEditDialog('')
    }

    useEffect(() => {
        if (ref.current && ref.current.offsetTop && ref.current.clientHeight) {
            setPosition(ref.current.offsetTop + ref.current.clientHeight / 2)
            updateNodeInternals(data.id)
        }
    }, [data.id, ref, updateNodeInternals])

    useEffect(() => {
        updateNodeInternals(data.id)
    }, [data.id, position, updateNodeInternals])

    return (
        <div ref={ref}>
            {inputAnchor && (
                <>
                    <CustomWidthTooltip placement='left' title={inputAnchor.type}>
                        <Handle
                            type='target'
                            position={Position.Left}
                            key={inputAnchor.id}
                            id={inputAnchor.id}
                            isValidConnection={(connection) => isValidConnection(connection, reactFlowInstance)}
                            style={{
                                height: 10,
                                width: 10,
                                backgroundColor: data.selected ? theme.palette.primary.main : theme.palette.text.secondary,
                                top: position
                            }}
                        />
                    </CustomWidthTooltip>
                    <Box sx={{ p: 2 }}>
                        <Typography>
                            {translateInputParamsAnchors[inputAnchor.label] || inputAnchor.label}
                            {!inputAnchor.optional && <span style={{ color: 'red' }}>&nbsp;*</span>}
                            {inputAnchor.description && <TooltipWithParser style={{ marginLeft: 10 }} title={inputAnchor.description} />}
                        </Typography>
                    </Box>
                </>
            )}

            {((inputParam && !inputParam.additionalParams) || isAdditionalParams) && (
                <>
                    {inputParam.acceptVariable && (
                        <CustomWidthTooltip placement='left' title={inputParam.type}>
                            <Handle
                                type='target'
                                position={Position.Left}
                                key={inputParam.id}
                                id={inputParam.id}
                                isValidConnection={(connection) => isValidConnection(connection, reactFlowInstance)}
                                style={{
                                    height: 10,
                                    width: 10,
                                    backgroundColor: data.selected ? theme.palette.primary.main : theme.palette.text.secondary,
                                    top: position
                                }}
                            />
                        </CustomWidthTooltip>
                    )}
                    <Box sx={{ p: 2 }}>
                        <div style={{ display: 'flex', flexDirection: 'row' }}>
                            <Typography>
                                {translateInputParamsAnchors[inputParam.label] || inputParam.label}
                                {!inputParam.optional && <span style={{ color: 'red' }}>&nbsp;*</span>}
                                {inputParam.description && <TooltipWithParser style={{ marginLeft: 10 }} title={inputParam.description} />}
                            </Typography>
                            <div style={{ flexGrow: 1 }}></div>
                            {inputParam.type === 'string' && inputParam.rows && (
                                <IconButton
                                    size='small'
                                    sx={{
                                        height: 25,
                                        width: 25
                                    }}
                                    title='Expand'
                                    color='primary'
                                    onClick={() =>
                                        onExpandDialogClicked(data.inputs[inputParam.name] ?? inputParam.default ?? '', inputParam)
                                    }
                                >
                                    <IconArrowsMaximize />
                                </IconButton>
                            )}
                        </div>
                        {inputParam.warning && (
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    borderRadius: 10,
                                    background: 'rgb(254,252,191)',
                                    padding: 10,
                                    marginTop: 10,
                                    marginBottom: 10
                                }}
                            >
                                <IconAlertTriangle size={36} color='orange' />
                                <span style={{ color: 'rgb(116,66,16)', marginLeft: 10 }}>{inputParam.warning}</span>
                            </div>
                        )}
                        {inputParam.type === 'credential' && (
                            <CredentialInputHandler
                                disabled={disabled}
                                data={data}
                                inputParam={inputParam}
                                onSelect={(newValue) => {
                                    data.credential = newValue
                                    data.inputs[FLOWISE_CREDENTIAL_ID] = newValue // in case data.credential is not updated
                                }}
                            />
                        )}
                        {inputParam.type === 'file' && (
                            <File
                                disabled={disabled}
                                fileType={inputParam.fileType || '*'}
                                onChange={(newValue) => (data.inputs[inputParam.name] = newValue)}
                                value={data.inputs[inputParam.name] ?? inputParam.default ?? 'Choose a file to upload'}
                            />
                        )}
                        {inputParam.type === 'boolean' && (
                            <SwitchInput
                                disabled={disabled}
                                onChange={(newValue) => (data.inputs[inputParam.name] = newValue)}
                                value={data.inputs[inputParam.name] ?? inputParam.default ?? false}
                            />
                        )}
                        {inputParam.type === 'datagrid' && (
                            <DataGrid
                                disabled={disabled}
                                columns={inputParam.datagrid}
                                hideFooter={true}
                                rows={data.inputs[inputParam.name] ?? JSON.stringify(inputParam.default) ?? []}
                                onChange={(newValue) => (data.inputs[inputParam.name] = newValue)}
                            />
                        )}
                        {(inputParam.type === 'string' || inputParam.type === 'password' || inputParam.type === 'number') && (
                            <Input
                                key={data.inputs[inputParam.name]}
                                disabled={disabled}
                                inputParam={inputParam}
                                onChange={(newValue) => (data.inputs[inputParam.name] = newValue)}
                                value={data.inputs[inputParam.name] ?? inputParam.default ?? ''}
                                nodes={inputParam?.acceptVariable && reactFlowInstance ? reactFlowInstance.getNodes() : []}
                                edges={inputParam?.acceptVariable && reactFlowInstance ? reactFlowInstance.getEdges() : []}
                                nodeId={data.id}
                                showDialog={showExpandDialog}
                                dialogProps={expandDialogProps}
                                onDialogCancel={() => setShowExpandDialog(false)}
                                onDialogConfirm={(newValue, inputParamName) => onExpandDialogSave(newValue, inputParamName)}
                            />
                        )}
                        {inputParam.type === 'json' && (
                            <>
                                {!inputParam?.acceptVariable && (
                                    <JsonEditorInput
                                        disabled={disabled}
                                        onChange={(newValue) => (data.inputs[inputParam.name] = newValue)}
                                        value={data.inputs[inputParam.name] ?? inputParam.default ?? ''}
                                        isDarkMode={customization.isDarkMode}
                                    />
                                )}
                                {inputParam?.acceptVariable && (
                                    <>
                                        <Button
                                            sx={{ borderRadius: 25, width: '100%', mb: 2, mt: 2 }}
                                            variant='outlined'
                                            onClick={() => onFormatPromptValuesClicked(data.inputs[inputParam.name] ?? '', inputParam)}
                                        >
                                            Format Prompt Values
                                        </Button>
                                        <FormatPromptValuesDialog
                                            show={showFormatPromptValuesDialog}
                                            dialogProps={formatPromptValuesDialogProps}
                                            onCancel={() => setShowFormatPromptValuesDialog(false)}
                                            onChange={(newValue) => (data.inputs[inputParam.name] = newValue)}
                                        ></FormatPromptValuesDialog>
                                    </>
                                )}
                            </>
                        )}
                        {inputParam.type === 'options' && (
                            <Dropdown
                                disabled={disabled}
                                name={inputParam.name}
                                options={inputParam.options}
                                onSelect={(newValue) => (data.inputs[inputParam.name] = newValue)}
                                value={data.inputs[inputParam.name] ?? inputParam.default ?? 'choose an option'}
                            />
                        )}
                        {inputParam.type === 'multiOptions' && (
                            <MultiDropdown
                                disabled={disabled}
                                name={inputParam.name}
                                options={inputParam.options}
                                onSelect={(newValue) => (data.inputs[inputParam.name] = newValue)}
                                value={data.inputs[inputParam.name] ?? inputParam.default ?? 'choose an option'}
                            />
                        )}
                        {inputParam.type === 'asyncOptions' && (
                            <>
                                {data.inputParams.length === 1 && <div style={{ marginTop: 10 }} />}
                                <div key={reloadTimestamp} style={{ display: 'flex', flexDirection: 'row' }}>
                                    <AsyncDropdown
                                        disabled={disabled}
                                        name={inputParam.name}
                                        nodeData={data}
                                        value={data.inputs[inputParam.name] ?? inputParam.default ?? 'choose an option'}
                                        isCreateNewOption={EDITABLE_OPTIONS.includes(inputParam.name)}
                                        onSelect={(newValue) => (data.inputs[inputParam.name] = newValue)}
                                        onCreateNew={() => addAsyncOption(inputParam.name)}
                                    />
                                    {EDITABLE_OPTIONS.includes(inputParam.name) && data.inputs[inputParam.name] && (
                                        <IconButton
                                            title='Edit'
                                            color='primary'
                                            size='small'
                                            onClick={() => editAsyncOption(inputParam.name, data.inputs[inputParam.name])}
                                        >
                                            <IconEdit />
                                        </IconButton>
                                    )}
                                </div>
                            </>
                        )}
                    </Box>
                </>
            )}
            <ToolDialog
                show={showAsyncOptionDialog === 'selectedTool'}
                dialogProps={asyncOptionEditDialogProps}
                onCancel={() => setAsyncOptionEditDialog('')}
                onConfirm={onConfirmAsyncOption}
            ></ToolDialog>
            <AssistantDialog
                show={showAsyncOptionDialog === 'selectedAssistant'}
                dialogProps={asyncOptionEditDialogProps}
                onCancel={() => setAsyncOptionEditDialog('')}
                onConfirm={onConfirmAsyncOption}
            ></AssistantDialog>
        </div>
    )
}

NodeInputHandler.propTypes = {
    inputAnchor: PropTypes.object,
    inputParam: PropTypes.object,
    data: PropTypes.object,
    disabled: PropTypes.bool,
    isAdditionalParams: PropTypes.bool
}

export default NodeInputHandler
