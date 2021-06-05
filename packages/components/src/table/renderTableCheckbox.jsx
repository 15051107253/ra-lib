import React, {useEffect, useState} from 'react';
import {Checkbox} from 'antd';
import {findGenerationNodes, findParentNodes} from '@ra-lib/util';

export default function renderTableCheckbox(WrappedTable) {
    return function WithCheckboxTable(props) {
        const {
            dataSource,
            rowSelection = {},
            rowKey = 'key',
            columns,
            checkboxIndex = 0,
            ...otherProps
        } = props;

        const {selectedRowKeys, renderCell: _renderCell, onSelectAll, onChange, ...others} = rowSelection;

        let nextColumns = columns;
        if (checkboxIndex !== false) {
            nextColumns = [...columns];
            const col = {...nextColumns[checkboxIndex]};
            if (!col.render) col.render = value => value;
            const render = (value, record, index) => (
                <>
                    {renderCell(null, record)}
                    <span style={{marginLeft: 8}}>
                        {col.render(value, record, index)}
                    </span>
                </>
            );
            nextColumns.splice(checkboxIndex, 1, {...col, render});
        }

        const [, setRefresh] = useState({});

        // 基于 selectedRowKeys 推导选中状态
        useEffect(() => {
            // 设置当前节点状态
            const loop = nodes => nodes.forEach(record => {
                record.___checked = (selectedRowKeys || []).some(id => id === record[rowKey]);

                if (record.children) loop(record.children);
            });

            loop(dataSource);

            // 设置父节点状态
            setParentsCheckStatus();

            // 触发重新render
            setRefresh({});

            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [selectedRowKeys, dataSource, rowKey]);


        function handleCheck(e, record) {
            const {checked} = e.target;

            const key = record[rowKey];

            // 当前节点状态
            record.___checked = checked;

            // 后代节点状态
            const generationNodes = record.___generationNodes || findGenerationNodes(dataSource, key);
            record.___generationNodes = generationNodes;

            // 父节点状态
            setParentsCheckStatus();

            generationNodes.forEach(node => node.___checked = checked);

            setSelectedKeys(dataSource);
        }

        function setParentsCheckStatus() {
            const loop = nodes => nodes.forEach(record => {
                if (record.children) loop(record.children);

                const key = record[rowKey];
                const parentNodes = record.___parentNodes || findParentNodes(dataSource, key) || [];

                record.___parentNodes = parentNodes;

                // 处理父级半选状态, 从底层向上处理
                [...parentNodes].reverse().forEach(node => {
                    const key = node[rowKey];
                    const generationNodes = node.___generationNodes || findGenerationNodes(dataSource, key);
                    node.___generationNodes = generationNodes;

                    let allChecked = true;
                    let hasChecked = false;

                    generationNodes.forEach(item => {
                        if (!item.___checked) allChecked = false;
                        if (item.___checked) hasChecked = true;
                    });

                    node.___checked = hasChecked;
                    node.___indeterminate = !allChecked && hasChecked;
                });
            });

            loop(dataSource);
        }

        function renderCell(_checked, record, index, originNode) {
            return (
                <Checkbox
                    checked={record.___checked}
                    onChange={e => handleCheck(e, record)}
                    indeterminate={record.___indeterminate}
                />
            );
        }

        function handleSelectAll(selected, selectedRows, changeRows) {
            const loop = nodes => nodes.forEach(node => {
                const {children} = node;
                node.___checked = selected;
                node.___indeterminate = false;
                if (children) loop(children);
            });
            loop(dataSource);
            setSelectedKeys(dataSource);
        }

        function setSelectedKeys(dataSource) {
            const {onChange} = rowSelection;

            const selectedRows = [];
            const selectedRowKeys = [];

            const loop = nodes => nodes.forEach(node => {
                const {children} = node;
                const key = node[rowKey];
                if (node.___checked) {
                    selectedRowKeys.push(key);
                    selectedRows.push(node);
                }
                if (children) loop(children);
            });
            loop(dataSource);

            onChange && onChange(selectedRowKeys, selectedRows);
        }

        return (
            <WrappedTable
                {...otherProps}
                columns={nextColumns}
                dataSource={dataSource}
                rowKey={rowKey}
                rowSelection={{
                    ...others,
                    selectedRowKeys: selectedRowKeys,
                    renderCell: checkboxIndex === false ? renderCell : () => null,
                    onSelectAll: handleSelectAll,
                }}
            />
        );
    };
}
/*

const testDataSource = [
    {id: '1', name: '名称1', remark: '备注1'},
    {id: '11', name: '名称11', remark: '备注11', parentId: '1'},
    {id: '111', name: '名称111', remark: '备注111', parentId: '11'},
    {id: '112', name: '名称112', remark: '备注112', parentId: '11'},
    {id: '113', name: '名称113', remark: '备注113', parentId: '11'},
    {id: '12', name: '名称12', remark: '备注12', parentId: '1'},
    {id: '13', name: '名称13', remark: '备注13', parentId: '1'},
    {id: '14', name: '名称14', remark: '备注14', parentId: '1'},
    {id: '2', name: '名称2', remark: '备注2'},
    {id: '3', name: '名称3', remark: '备注3'},
    {id: '4', name: '名称4', remark: '备注4'},
];

const CheckboxTable = renderTableCheckbox(Table);

@config({
    path: '/table/select',
})
export default class TableSelect extends React.Component {
    state = {
        dataSource: [],
        selectedRowKeys: ['111', '112', '113', '4'],
        selectedRows: [],
    };
    columns = [
        {
            title: '名称', dataIndex: 'name',
            render: (value, record) => value + 2222,
        },
        {title: '备注', dataIndex: 'remark'},
    ];

    componentDidMount() {
        this.setState({dataSource: convertToTree(testDataSource)});
    }

    handleChange = (selectedRowKeys, selectedRows) => {

        this.setState({selectedRowKeys, selectedRows});
    };

    render() {
        const {dataSource, selectedRowKeys} = this.state;

        return (
            <PageContent>
                <CheckboxTable
                    fitHeight
                    rowSelection={{
                        selectedRowKeys,
                        onChange: this.handleChange,
                    }}
                    columns={this.columns}
                    dataSource={dataSource}
                    rowKey="id"
                    pagination={false}
                />
            </PageContent>
        );
    }
}
*/
