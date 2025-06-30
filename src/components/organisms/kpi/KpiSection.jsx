import { useState, useEffect, useMemo } from "react";

export default function KpiSection({ title, category, globalKpiData, setGlobalKpiData }) {
    const [localData, setLocalData] = useState([]);

    const filteredData = useMemo(() => {
        return globalKpiData
            .filter((item) => item.category === category)
            .map((item) => ({
                ...item,
                newValue: item.newValue ?? item.value,
            }));
    }, [globalKpiData, category]);

    useEffect(() => {
        setLocalData(filteredData);
    }, [filteredData]);


    const handleInputChange = (index, newValue) => {
        const updated = [...localData];
        updated[index].newValue = newValue;

        setLocalData(updated);

        const updatedGlobal = globalKpiData.map((item) => {
            if (
                item.category === category &&
                item.name === updated[index].name
            ) {
                return { ...item, newValue };
            }
            return item;
        });

        setGlobalKpiData(updatedGlobal);
    };

    const formatValue = (name, value) => {
        const isPercentage = name.toLowerCase().includes("adjustment");
        return isPercentage ? `${value}%` : value;
    };

    return (
        <div className="card" style={{ width: "100%" }}>
            <div className="card-body">
                <h5 className="text-left pb-2">{title}</h5>
                <div className="table-responsive" style={{ borderRadius: "0.2rem" }}>
                    <table className="table table-centered">
                        <thead className="table-dark">
                            <tr>
                                <th>Name</th>
                                <th>Value</th>
                                <th>New Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {localData.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.name}</td>
                                    <td>{formatValue(item.name, item.value)}</td>
                                    <td>
                                        <input
                                            style={{
                                                width: "100%",
                                                padding: "0.375rem 0.75rem",
                                                fontSize: "1rem",
                                                fontWeight: "400",
                                                lineHeight: "1.5",
                                                border: "1px solid #ced4da",
                                                borderRadius: "0.25rem",
                                            }}
                                            min={0}
                                            type="number"
                                            value={item.newValue}
                                            onChange={(e) =>
                                                handleInputChange(index, e.target.value)
                                            }
                                            placeholder="Enter new value"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};